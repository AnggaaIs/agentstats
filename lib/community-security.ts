import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const COMMUNITY_DEVICE_COOKIE = "agentstats_community_device";
export const COMMUNITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret || secret.length < 24) {
    throw new Error("AUTH_SECRET must contain at least 24 characters.");
  }

  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createDeviceCredential(): string {
  const token = randomBytes(32).toString("base64url");
  return `${token}.${sign(token)}`;
}

export function verifyDeviceCredential(
  credential: string | undefined,
): string | null {
  if (!credential) return null;

  const [token, signature, extra] = credential.split(".");
  if (!token || !signature || extra) return null;

  const expected = Buffer.from(sign(token));
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  return token;
}

export function hashDeviceToken(token: string): string {
  return createHmac("sha256", getSecret())
    .update(`device:${token}`)
    .digest("hex");
}

export function hashRequestNetwork(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const address =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unavailable";

  return createHmac("sha256", getSecret())
    .update(`network:${address}`)
    .digest("hex");
}

export function isTrustedRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowedOrigins = new Set<string>([new URL(request.url).origin]);
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (publicUrl) {
    try {
      allowedOrigins.add(new URL(publicUrl).origin);
    } catch {
      return false;
    }
  }

  return allowedOrigins.has(origin);
}
