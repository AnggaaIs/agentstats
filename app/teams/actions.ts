"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { TeamRole } from "@/lib/generated/prisma/enums";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

const createTeamSchema = z.object({
  name: z.string().trim().min(3).max(48),
});

export async function createTeam(formData: FormData) {
  const userId = await requireUserId();
  const input = createTeamSchema.safeParse({ name: formData.get("name") });
  if (!input.success) redirect("/teams?status=invalid-team");
  const joinCode = randomBytes(6).toString("base64url").toUpperCase();

  const team = await prisma.team.create({
    data: {
      ownerId: userId,
      name: input.data.name,
      joinCode,
      members: {
        create: { userId, role: TeamRole.OWNER },
      },
    },
  });
  revalidatePath("/teams");
  redirect(`/teams/${team.id}?status=created`);
}

const joinTeamSchema = z.object({
  joinCode: z.string().trim().min(6).max(20).transform((value) =>
    value.toUpperCase(),
  ),
});

export async function joinTeam(formData: FormData) {
  const userId = await requireUserId();
  const input = joinTeamSchema.safeParse({
    joinCode: formData.get("joinCode"),
  });
  if (!input.success) redirect("/teams?status=invalid-code");
  const team = await prisma.team.findUnique({
    where: { joinCode: input.data.joinCode },
    select: { id: true },
  });
  if (!team) redirect("/teams?status=team-not-found");

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId } },
    create: { teamId: team.id, userId, role: TeamRole.MEMBER },
    update: {},
  });
  revalidatePath("/teams");
  revalidatePath(`/teams/${team.id}`);
  redirect(`/teams/${team.id}?status=joined`);
}

const teamIdSchema = z.object({ teamId: z.string().cuid() });

export async function leaveTeam(formData: FormData) {
  const userId = await requireUserId();
  const input = teamIdSchema.safeParse({ teamId: formData.get("teamId") });
  if (!input.success) redirect("/teams?status=invalid-team");
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: input.data.teamId, userId } },
    select: { role: true },
  });
  if (!membership) redirect("/teams");
  if (membership.role === TeamRole.OWNER) {
    redirect(`/teams/${input.data.teamId}?status=owner-cannot-leave`);
  }
  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId: input.data.teamId, userId } },
  });
  revalidatePath("/teams");
  redirect("/teams?status=left");
}

const deleteTeamSchema = z.object({
  teamId: z.string().cuid(),
  deleteConfirmation: z.literal("on"),
});

export async function deleteTeam(formData: FormData) {
  const userId = await requireUserId();
  const input = deleteTeamSchema.safeParse({
    teamId: formData.get("teamId"),
    deleteConfirmation: formData.get("deleteConfirmation"),
  });
  if (!input.success) redirect("/teams?status=invalid-team");
  await prisma.team.deleteMany({
    where: { id: input.data.teamId, ownerId: userId },
  });
  revalidatePath("/teams");
  redirect("/teams?status=deleted");
}
