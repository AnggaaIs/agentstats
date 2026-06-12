"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth, signOut } from "@/auth";
import { REGIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { ProfileVisibility } from "@/lib/generated/prisma/enums";
import { PLAYER_DATA_CONSENT_VERSION } from "@/lib/legal";

const accountSettingsSchema = z.object({
  region: z.enum(REGIONS),
  visibility: z.enum(["PRIVATE", "PUBLIC"]),
  publicationConsent: z.literal("on").optional(),
});

export async function updateAccountSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const input = accountSettingsSchema.safeParse({
    region: formData.get("region"),
    visibility: formData.get("visibility"),
    publicationConsent: formData.get("publicationConsent") || undefined,
  });
  if (!input.success) redirect("/account?status=invalid");

  const wantsPublic = input.data.visibility === "PUBLIC";
  if (wantsPublic && input.data.publicationConsent !== "on") {
    redirect("/account?status=consent-required");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { consentVersion: true, consentedAt: true },
  });
  const hasCurrentDataConsent = Boolean(
    user?.consentedAt &&
      user.consentVersion === PLAYER_DATA_CONSENT_VERSION,
  );
  if (wantsPublic && !hasCurrentDataConsent) {
    redirect("/account?status=data-consent-required");
  }

  const now = new Date();
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      region: input.data.region,
      visibility: wantsPublic
        ? ProfileVisibility.PUBLIC
        : ProfileVisibility.PRIVATE,
      publishedAt: wantsPublic ? now : null,
    },
  });

  revalidatePath("/account");
  revalidatePath("/");
  revalidatePath("/agents/meta");
  revalidatePath("/maps/meta");
  if (session.user.gameName && session.user.tagLine) {
    revalidatePath(
      `/player/${input.data.region}/${encodeURIComponent(session.user.gameName)}/${encodeURIComponent(session.user.tagLine)}`,
    );
  }
  redirect("/account?status=saved");
}

const disconnectSchema = z.object({
  disconnectConfirmation: z.literal("on"),
});

export async function disconnectRiotAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const input = disconnectSchema.safeParse({
    disconnectConfirmation:
      formData.get("disconnectConfirmation") || undefined,
  });
  if (!input.success) redirect("/account?status=disconnect-confirmation");

  await signOut({ redirect: false });
  await prisma.user.delete({ where: { id: session.user.id } });
  redirect("/");
}

export async function logOut() {
  await signOut({ redirectTo: "/" });
}
