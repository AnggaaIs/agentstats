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
