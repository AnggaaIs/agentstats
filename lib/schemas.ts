import { z } from "zod";

import { REGIONS } from "@/lib/constants";

export const playerSearchSchema = z.object({
  name: z.string().trim().min(3, "Name must contain at least 3 characters.").max(16),
  tag: z
    .string()
    .trim()
    .min(2, "Tag must contain at least 2 characters.")
    .max(16, "Tag is too long.")
    .regex(/^[a-zA-Z0-9]+$/, "Tag must be alphanumeric."),
  region: z.enum(REGIONS),
});

export type PlayerSearchInput = z.infer<typeof playerSearchSchema>;

export const favoriteCategorySchema = z.enum(["agent", "map", "weapon"]);

export const communityVoteSchema = z.object({
  category: favoriteCategorySchema,
  scopeKey: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  targetId: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      "Choose a valid catalog item.",
    ),
  website: z.string().max(0).optional().default(""),
});
