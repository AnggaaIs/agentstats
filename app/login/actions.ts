"use server";

import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/auth";
import { LEGAL_CONSENT_COOKIE, LEGAL_CONSENT_VERSION } from "@/lib/legal";
import { isRsoConfigured } from "@/lib/auth-config";
import { prisma } from "@/lib/db";

const loginSchema = z.object({
  legalConsent: z.literal("on"),
});

export async function connectRiotAccount(formData: FormData) {
  if (!isRsoConfigured()) return;

  const parsed = loginSchema.safeParse({
    legalConsent: formData.get("legalConsent") || undefined,
  });
  if (!parsed.success) {
    redirect("/login?status=consent-required");
  }

  const token = randomUUID();
  await prisma.legalConsent.create({
    data: {
      token,
      consentVersion: LEGAL_CONSENT_VERSION,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: LEGAL_CONSENT_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  await signIn("riot", { redirectTo: "/account" });
}
