"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth, signOut } from "@/auth";
import { PLAYER_CONSENT_VERSION } from "@/lib/auth-config";
import { REGIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { ProfileVisibility } from "@/lib/generated/prisma/enums";

const accountSettingsSchema = z.object({
  region: z.enum(REGIONS),
  visibility: z.enum(["PRIVATE", "PUBLIC"]),
  consent: z.literal("on").optional(),
});

export async function updateAccountSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const input = accountSettingsSchema.safeParse({
    region: formData.get("region"),
    visibility: formData.get("visibility"),
    consent: formData.get("consent") || undefined,
  });
  if (!input.success) redirect("/account?status=invalid");

  const wantsPublic = input.data.visibility === "PUBLIC";
  if (wantsPublic && input.data.consent !== "on") {
    redirect("/account?status=consent-required");
  }

  const now = new Date();
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      region: input.data.region,
      visibility: wantsPublic
        ? ProfileVisibility.PUBLIC
        : ProfileVisibility.PRIVATE,
      consentVersion: wantsPublic ? PLAYER_CONSENT_VERSION : null,
      consentedAt: wantsPublic ? now : null,
      publishedAt: wantsPublic ? now : null,
      revokedAt: wantsPublic ? null : now,
    },
  });

  revalidatePath("/account");
  if (session.user.gameName && session.user.tagLine) {
    revalidatePath(
      `/player/${input.data.region}/${encodeURIComponent(session.user.gameName)}/${encodeURIComponent(session.user.tagLine)}`,
    );
  }
  redirect("/account?status=saved");
}

export async function disconnectRiotAccount() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await signOut({ redirect: false });
  await prisma.user.delete({ where: { id: session.user.id } });
  redirect("/");
}

export async function logOut() {
  await signOut({ redirectTo: "/" });
}
