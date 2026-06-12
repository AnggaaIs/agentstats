import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_FAVORITE_SCOPE,
  getCommunityCounts,
  toFavoriteScope,
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

const DEVICE_CHANGES_PER_DAY = 40;
const NETWORK_VOTES_PER_HOUR = 120;
const NETWORK_DEVICES_PER_HOUR = 60;
const MAX_VOTE_BODY_BYTES = 1_024;

class VoteLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSeconds: number,
  ) {
    super(message);
    this.name = "VoteLimitError";
  }
}

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

async function resolveTargetScope(
  category: FavoriteCategoryName,
  targetId: string,
  requestedScope?: string,
): Promise<string | null> {
  try {
    if (category === "agent") {
      const agent = await getAgent(targetId);
      return toFavoriteScope(agent.role?.displayName ?? "other");
    }

    if (category === "weapon") {
      await getWeapon(targetId);
      return DEFAULT_FAVORITE_SCOPE;
    }

    if (category === "skin") {
      if (!requestedScope) return null;

      const weapon = await getWeapon(requestedScope);
      return weapon.skins.some((skin) => skin.uuid === targetId)
        ? weapon.uuid
        : null;
    }

    const map = await getMap(targetId);
    return map.splash && map.displayName !== "The Range"
      ? DEFAULT_FAVORITE_SCOPE
      : null;
  } catch {
    return null;
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

async function readVoteBody(request: NextRequest): Promise<unknown> {
  if (!request.body) throw new Error("Missing request body.");

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_VOTE_BODY_BYTES) {
        throw new VoteLimitError("The vote request is too large.", 0);
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  return JSON.parse(body);
}

export async function GET(request: NextRequest) {
  const parsedCategory = favoriteCategorySchema.safeParse(
    request.nextUrl.searchParams.get("category"),
  );

  if (!parsedCategory.success) {
    return apiError("Choose a valid favorite category.", 400);
  }

  const category = parsedCategory.data;
  const scopeKey = toFavoriteScope(
    request.nextUrl.searchParams.get("scopeKey"),
  );
  const token = verifyDeviceCredential(
    request.cookies.get(COMMUNITY_DEVICE_COOKIE)?.value,
  );
  const [counts, selected] = await Promise.all([
    getCommunityCounts(category),
    token
      ? prisma.communityVote.findUnique({
          where: {
            deviceHash_category_scopeKey: {
              deviceHash: hashDeviceToken(token),
              category: toDatabaseCategory(category),
              scopeKey,
            },
          },
          select: { targetId: true },
        })
      : null,
  ]);

  return apiSuccess({
    category,
    scopeKey,
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

  if (contentLength > MAX_VOTE_BODY_BYTES) {
    return apiError("The vote request is too large.", 413);
  }

  let body: unknown;
  try {
    body = await readVoteBody(request);
  } catch (error) {
    if (error instanceof VoteLimitError) {
      return apiError(error.message, 413);
    }
    return apiError("The vote request is not valid.", 400);
  }

  const parsed = communityVoteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Choose a valid community favorite.", 400);
  }

  const { category, targetId } = parsed.data;
  const scopeKey = await resolveTargetScope(
    category,
    targetId,
    parsed.data.scopeKey,
  );
  if (!scopeKey) {
    return apiError("That item is not available for community voting.", 404);
  }
  if (parsed.data.scopeKey && parsed.data.scopeKey !== scopeKey) {
    return apiError("That favorite does not match its selected group.", 400);
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
            deviceHash_category_scopeKey: {
              deviceHash,
              category: databaseCategory,
              scopeKey,
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

        if (deviceChanges >= DEVICE_CHANGES_PER_DAY) {
          throw new VoteLimitError(
            "You reached the daily favorite change limit. Try again later.",
            86_400,
          );
        }

        if (
          networkVotes >= NETWORK_VOTES_PER_HOUR ||
          networkDevices.length >= NETWORK_DEVICES_PER_HOUR
        ) {
          throw new VoteLimitError(
            "Favorite voting is busy on this network. Try again in about an hour.",
            3_600,
          );
        }

        const updated = await transaction.communityVote.upsert({
          where: {
            deviceHash_category_scopeKey: {
              deviceHash,
              category: databaseCategory,
              scopeKey,
            },
          },
          create: {
            deviceHash,
            category: databaseCategory,
            scopeKey,
            targetId,
          },
          update: { targetId },
        });

        await transaction.voteEvent.create({
          data: {
            deviceHash,
            networkHash,
            category: databaseCategory,
            scopeKey,
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
      scopeKey,
      selectedTargetId: vote.targetId,
      counts,
      totalVotes: counts.reduce((sum, item) => sum + item.votes, 0),
    });
    setDeviceCookie(response, credential);
    return response;
  } catch (error) {
    if (error instanceof VoteLimitError) {
      const response = apiError(error.message, 429);
      response.headers.set(
        "Retry-After",
        error.retryAfterSeconds.toString(),
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
  const hasScope = request.nextUrl.searchParams.has("scopeKey");
  const scopeKey = toFavoriteScope(
    request.nextUrl.searchParams.get("scopeKey"),
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
          ? {
              category: toDatabaseCategory(parsedCategory.data),
              ...(hasScope ? { scopeKey } : {}),
            }
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
