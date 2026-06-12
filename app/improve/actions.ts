"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import {
  buildEvidenceCoach,
  buildSessionDebrief,
  getMetricDefinition,
  getMetricValue,
} from "@/lib/improvement";
import { prisma } from "@/lib/db";
import {
  ImprovementMetric,
  ImprovementPlanStatus,
} from "@/lib/generated/prisma/enums";
import { getPlayerWorkspaceSummary } from "@/lib/player-workspace";
import { buildShareReportSnapshot } from "@/lib/share-report";

const metricSchema = z.nativeEnum(ImprovementMetric);
const regionSchema = z.enum(["ap", "na", "eu", "kr", "br", "latam"]);

async function requireWorkspaceUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      puuid: true,
      gameName: true,
      tagLine: true,
      region: true,
    },
  });
  if (!user?.puuid) redirect("/account");
  const region = regionSchema.safeParse(user.region);
  if (!region.success) redirect("/account");
  return { ...user, puuid: user.puuid, region: region.data };
}

const planSchema = z.object({
  metric: metricSchema,
  targetValue: z.coerce.number().finite().min(0).max(1000),
  durationDays: z.coerce.number().int().refine((value) =>
    [7, 14, 30].includes(value),
  ),
});

export async function createImprovementPlan(formData: FormData) {
  const user = await requireWorkspaceUser();
  const input = planSchema.safeParse({
    metric: formData.get("metric"),
    targetValue: formData.get("targetValue"),
    durationDays: formData.get("durationDays"),
  });
  if (!input.success) redirect("/improve?status=invalid-plan#plans");

  const { summary } = await getPlayerWorkspaceSummary(user);
  const baselineValue = getMetricValue(summary, input.data.metric);
  const definition = getMetricDefinition(input.data.metric);
  const targetMovesForward =
    definition.direction === "higher"
      ? input.data.targetValue > baselineValue
      : input.data.targetValue < baselineValue;
  if (!targetMovesForward) {
    redirect("/improve?status=invalid-plan-direction#plans");
  }
  const endsAt = new Date(
    Date.now() + input.data.durationDays * 24 * 60 * 60 * 1000,
  );

  await prisma.$transaction([
    prisma.improvementPlan.updateMany({
      where: {
        userId: user.id,
        metric: input.data.metric,
        status: ImprovementPlanStatus.ACTIVE,
      },
      data: { status: ImprovementPlanStatus.ARCHIVED },
    }),
    prisma.improvementPlan.create({
      data: {
        userId: user.id,
        metric: input.data.metric,
        baselineValue,
        targetValue: input.data.targetValue,
        durationDays: input.data.durationDays,
        endsAt,
      },
    }),
  ]);

  revalidatePath("/improve");
  redirect("/improve?status=plan-created#plans");
}

const planStatusSchema = z.object({
  planId: z.string().cuid(),
  status: z.enum(["COMPLETED", "ARCHIVED"]),
});

export async function updateImprovementPlan(formData: FormData) {
  const user = await requireWorkspaceUser();
  const input = planStatusSchema.safeParse({
    planId: formData.get("planId"),
    status: formData.get("status"),
  });
  if (!input.success) redirect("/improve?status=invalid-plan#plans");

  await prisma.improvementPlan.updateMany({
    where: { id: input.data.planId, userId: user.id },
    data: {
      status:
        input.data.status === "COMPLETED"
          ? ImprovementPlanStatus.COMPLETED
          : ImprovementPlanStatus.ARCHIVED,
      completedAt:
        input.data.status === "COMPLETED" ? new Date() : null,
    },
  });
  revalidatePath("/improve");
  redirect("/improve?status=plan-updated#plans");
}

const journalSchema = z.object({
  matchId: z.string().trim().min(1).max(120),
  focus: z.string().trim().min(2).max(80),
  mood: z.coerce.number().int().min(1).max(5),
  stackSize: z.coerce.number().int().min(1).max(5),
  note: z.string().trim().min(3).max(1200),
  vodUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || z.url().safeParse(value).success,
      "Enter a valid URL.",
    ),
});

export async function saveMatchJournal(formData: FormData) {
  const user = await requireWorkspaceUser();
  const input = journalSchema.safeParse({
    matchId: formData.get("matchId"),
    focus: formData.get("focus"),
    mood: formData.get("mood"),
    stackSize: formData.get("stackSize"),
    note: formData.get("note"),
    vodUrl: formData.get("vodUrl"),
  });
  if (!input.success) redirect("/improve?status=invalid-journal#journal");

  const { summary } = await getPlayerWorkspaceSummary(user);
  if (!summary.matches.some((match) => match.matchId === input.data.matchId)) {
    redirect("/improve?status=unknown-match#journal");
  }

  await prisma.matchJournal.upsert({
    where: {
      userId_matchId: {
        userId: user.id,
        matchId: input.data.matchId,
      },
    },
    create: {
      userId: user.id,
      ...input.data,
      vodUrl: input.data.vodUrl || null,
    },
    update: {
      focus: input.data.focus,
      mood: input.data.mood,
      stackSize: input.data.stackSize,
      note: input.data.note,
      vodUrl: input.data.vodUrl || null,
    },
  });
  revalidatePath("/improve");
  redirect("/improve?status=journal-saved#journal");
}

const reportSchema = z.object({
  title: z.string().trim().min(3).max(80),
  anonymized: z.enum(["on"]).optional(),
  publicationConsent: z.literal("on"),
  expiryDays: z.coerce.number().int().refine((value) =>
    [7, 30, 0].includes(value),
  ),
});

export async function createShareReport(formData: FormData) {
  const user = await requireWorkspaceUser();
  const input = reportSchema.safeParse({
    title: formData.get("title"),
    anonymized: formData.get("anonymized") || undefined,
    publicationConsent: formData.get("publicationConsent"),
    expiryDays: formData.get("expiryDays"),
  });
  if (!input.success) redirect("/improve?status=invalid-report#reports");

  const { summary } = await getPlayerWorkspaceSummary(user);
  const coach = buildEvidenceCoach(summary);
  const debrief = buildSessionDebrief(summary);
  const anonymized = input.data.anonymized === "on";
  const snapshot = buildShareReportSnapshot({
    summary,
    coach,
    debrief,
    gameName: user.gameName,
    tagLine: user.tagLine,
    region: user.region,
    anonymized,
  });
  const token = randomBytes(18).toString("base64url");
  const expiresAt =
    input.data.expiryDays === 0
      ? null
      : new Date(
          Date.now() + input.data.expiryDays * 24 * 60 * 60 * 1000,
        );

  await prisma.shareReport.create({
    data: {
      userId: user.id,
      token,
      title: input.data.title,
      anonymized,
      snapshot,
      expiresAt,
    },
  });
  revalidatePath("/improve");
  redirect(`/improve?status=report-created&token=${token}#reports`);
}

const reportIdSchema = z.object({ reportId: z.string().cuid() });

export async function revokeShareReport(formData: FormData) {
  const user = await requireWorkspaceUser();
  const input = reportIdSchema.safeParse({
    reportId: formData.get("reportId"),
  });
  if (!input.success) redirect("/improve?status=invalid-report#reports");

  await prisma.shareReport.updateMany({
    where: { id: input.data.reportId, userId: user.id },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/improve");
  redirect("/improve?status=report-revoked#reports");
}
