import { createHmac, timingSafeEqual } from "crypto";

function getInternalSharedSecret() {
  const secret = process.env.ROADMAP_INTERNAL_SHARED_SECRET?.trim();
  if (!secret) {
    throw new Error("ROADMAP_INTERNAL_SHARED_SECRET is not configured.");
  }
  return secret;
}

function buildPreviewPayload(params: {
  roadmapId: string;
  slug: string;
  expiresAt: number;
}) {
  return `preview.${params.roadmapId}.${params.slug}.${params.expiresAt}`;
}

function buildPreviewSignature(params: {
  roadmapId: string;
  slug: string;
  expiresAt: number;
}) {
  return createHmac("sha256", getInternalSharedSecret())
    .update(buildPreviewPayload(params))
    .digest("hex");
}

export function verifyRoadmapPreviewSignature(params: {
  roadmapId: string;
  slug: string;
  expires: string | null | undefined;
  signature: string | null | undefined;
  now?: number;
}) {
  const { roadmapId, slug, expires, signature, now = Date.now() } = params;
  if (!roadmapId || !slug || !expires || !signature) {
    return false;
  }

  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < now) {
    return false;
  }

  const expected = buildPreviewSignature({
    roadmapId,
    slug,
    expiresAt,
  });

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
