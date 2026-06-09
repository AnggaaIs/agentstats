import { NextRequest, NextResponse } from "next/server";

import {
  getCommunityCounts,
  toDatabaseCategory,
  type FavoriteCategoryName,
} from "@/lib/community";
import {
  COMMUNITY_COOKIE_MAX_AGE,
  COMMUNITY_DEVICE_COOKIE,
  createDeviceCredential,
  hashDeviceToken,
  hashRequestNetwork,
  isTrustedRequestOrigin,
  verifyDeviceCredential,
} from "@/lib/community-security";
import { prisma } from "@/lib/db";
import { VoteAction } from "@/lib/generated/prisma/enums";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  communityVoteSchema,
  favoriteCategorySchema,
} from "@/lib/schemas";
import { getAgent, getMap, getWeapon } from "@/lib/valorant-api";

const DEVICE_CHANGES_PER_DAY = 8;
const NETWORK_VOTES_PER_HOUR = 120;
const NETWORK_DEVICES_PER_HOUR = 60;

class VoteLimitError extends Error {}

function setDeviceCookie(response: NextResponse, credential: string) {
  response.cookies.set({
    name: COMMUNITY_DEVICE_COOKIE,
    value: credential,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COMMUNITY_COOKIE_MAX_AGE,
  });
}

async function targetExists(
  category: FavoriteCategoryName,
  targetId: string,
): Promise<boolean> {
  try {
    if (category === "agent") {
      await getAgent(targetId);
      return true;
    }

    if (category === "weapon") {
      await getWeapon(targetId);
      return true;
    }

    const map = await getMap(targetId);
    return Boolean(map.splash && map.displayName !== "The Range");
  } catch {
    return false;
  }
}

function getCredential(request: NextRequest) {
  const current = request.cookies.get(COMMUNITY_DEVICE_COOKIE)?.value;
  const token = verifyDeviceCredential(current);

  if (token && current) {
    return { credential: current, token };
  }

  const credential = createDeviceCredential();
  const createdToken = verifyDeviceCredential(credential);

  if (!createdToken) {
    throw new Error("Could not create a voting device credential.");
  }

  return { credential, token: createdToken };
}

export async function GET(request: NextRequest) {
  const parsedCategory = favoriteCategorySchema.safeParse(
    request.nextUrl.searchParams.get("category"),
  );

  if (!parsedCategory.success) {
    return apiError("Choose a valid favorite category.", 400);
  }

  const category = parsedCategory.data;
  const token = verifyDeviceCredential(
    request.cookies.get(COMMUNITY_DEVICE_COOKIE)?.value,
  );
  const [counts, selected] = await Promise.all([
    getCommunityCounts(category),
    token
      ? prisma.communityVote.findUnique({
          where: {
            deviceHash_category: {
              deviceHash: hashDeviceToken(token),
              category: toDatabaseCategory(category),
            },
          },
          select: { targetId: true },
        })
      : null,
  ]);

  return apiSuccess({
    category,
    counts,
    selectedTargetId: selected?.targetId ?? null,
    totalVotes: counts.reduce((sum, item) => sum + item.votes, 0),
  });
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (
    !isTrustedRequestOrigin(request) ||
    !request.headers.get("content-type")?.includes("application/json")
  ) {
    return apiError("This vote could not be verified.", 403);
  }

  if (contentLength > 1_024) {
    return apiError("The vote request is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("The vote request is not valid.", 400);
  }

  const parsed = communityVoteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Choose a valid community favorite.", 400);
  }

  const { category, targetId } = parsed.data;
  if (!(await targetExists(category, targetId))) {
    return apiError("That item is not available for community voting.", 404);
  }

  const { credential, token } = getCredential(request);
  const deviceHash = hashDeviceToken(token);
  const networkHash = hashRequestNetwork(request);
  const databaseCategory = toDatabaseCategory(category);
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1_000);

  try {
    const vote = await prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.communityVote.findUnique({
          where: {
            deviceHash_category: {
              deviceHash,
              category: databaseCategory,
            },
          },
        });

        if (existing?.targetId === targetId) {
          return existing;
        }

        const [deviceChanges, networkVotes, networkDevices] =
          await Promise.all([
            transaction.voteEvent.count({
              where: { deviceHash, createdAt: { gte: oneDayAgo } },
            }),
            transaction.voteEvent.count({
              where: { networkHash, createdAt: { gte: oneHourAgo } },
            }),
            transaction.voteEvent.findMany({
              where: { networkHash, createdAt: { gte: oneHourAgo } },
              distinct: ["deviceHash"],
              select: { deviceHash: true },
              take: NETWORK_DEVICES_PER_HOUR + 1,
            }),
          ]);

        if (
          deviceChanges >= DEVICE_CHANGES_PER_DAY ||
          networkVotes >= NETWORK_VOTES_PER_HOUR ||
          networkDevices.length >= NETWORK_DEVICES_PER_HOUR
        ) {
          throw new VoteLimitError();
        }

        const updated = await transaction.communityVote.upsert({
          where: {
            deviceHash_category: {
              deviceHash,
              category: databaseCategory,
            },
          },
          create: { deviceHash, category: databaseCategory, targetId },
          update: { targetId },
        });

        await transaction.voteEvent.create({
          data: {
            deviceHash,
            networkHash,
            category: databaseCategory,
            targetId,
            action: existing ? VoteAction.CHANGED : VoteAction.CREATED,
          },
        });

        return updated;
      },
      { isolationLevel: "Serializable" },
    );

    const counts = await getCommunityCounts(category);
    await prisma.voteEvent.deleteMany({
      where: {
        createdAt: {
          lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1_000),
        },
      },
    });
    const response = apiSuccess({
      category,
      selectedTargetId: vote.targetId,
      counts,
      totalVotes: counts.reduce((sum, item) => sum + item.votes, 0),
    });
    setDeviceCookie(response, credential);
    return response;
  } catch (error) {
    if (error instanceof VoteLimitError) {
      const response = apiError(
        "Too many favorite changes were made recently. Please try again later.",
        429,
      );
      setDeviceCookie(response, credential);
      return response;
    }

    return apiError("The favorite could not be saved right now.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedRequestOrigin(request)) {
    return apiError("This request could not be verified.", 403);
  }

  const token = verifyDeviceCredential(
    request.cookies.get(COMMUNITY_DEVICE_COOKIE)?.value,
  );

  if (!token) {
    return apiSuccess({ removed: 0 });
  }

  const parsedCategory = favoriteCategorySchema.safeParse(
    request.nextUrl.searchParams.get("category"),
  );
  const deviceHash = hashDeviceToken(token);

  if (request.nextUrl.searchParams.has("category") && !parsedCategory.success) {
    return apiError("Choose a valid favorite category.", 400);
  }

  const result = await prisma.$transaction(async (transaction) => {
    const removed = await transaction.communityVote.deleteMany({
      where: {
        deviceHash,
        ...(parsedCategory.success
          ? { category: toDatabaseCategory(parsedCategory.data) }
          : {}),
      },
    });

    if (!parsedCategory.success) {
      await transaction.voteEvent.deleteMany({ where: { deviceHash } });
    }

    return removed.count;
  });

  const response = apiSuccess({ removed: result });
  if (!parsedCategory.success) {
    response.cookies.delete(COMMUNITY_DEVICE_COOKIE);
  }
  return response;
}
