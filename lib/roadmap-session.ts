import { createHmac, timingSafeEqual } from "crypto";

export const ROADMAP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getRoadmapSessionSecret() {
  const secret = process.env.ROADMAP_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("ROADMAP_SESSION_SECRET is not configured.");
  }
  return secret;
}

function signRoadmapSession(payload: string) {
  return createHmac("sha256", getRoadmapSessionSecret()).update(payload).digest("base64url");
}

export function getRoadmapSessionCookieName(slug: string) {
  const safeSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `roadmap_access_${safeSlug}`;
}

export function createRoadmapSessionCookieValue(slug: string) {
  const expiresAt = Date.now() + ROADMAP_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${slug}.${expiresAt}`;
  const signature = signRoadmapSession(payload);
  return `${payload}.${signature}`;
}

export function verifyRoadmapSessionCookieValue(slug: string, value: string | undefined) {
  if (!value) {
    return false;
  }

  const parts = value.split(".");
  if (parts.length < 3) {
    return false;
  }

  const signature = parts.pop() || "";
  const expiresAtRaw = parts.pop() || "";
  const slugValue = parts.join(".");
  if (slugValue !== slug) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  const payload = `${slugValue}.${expiresAtRaw}`;
  const expected = signRoadmapSession(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}
