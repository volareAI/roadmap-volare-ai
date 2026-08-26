import { createHash, createHmac } from "crypto";
import { unstable_cache } from "next/cache";
import type {
  RoadmapDraftPreviewResponse,
  RoadmapMetaResponse,
  RoadmapSnapshotResponse,
} from "@/lib/roadmap-types";

function getDashboardApiBaseUrl() {
  const baseUrl = process.env.DASHBOARD_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error("DASHBOARD_API_BASE_URL is not configured.");
  }
  return baseUrl;
}

function getInternalSharedSecret() {
  const secret = process.env.ROADMAP_INTERNAL_SHARED_SECRET?.trim();
  if (!secret) {
    throw new Error("ROADMAP_INTERNAL_SHARED_SECRET is not configured.");
  }
  return secret;
}

function hashBody(body: string) {
  return createHash("sha256").update(body).digest("hex");
}

function buildRoadmapInternalSignature(params: {
  timestamp: string;
  method: string;
  pathname: string;
  body: string;
}) {
  const payload = `${params.timestamp}.${params.method.toUpperCase()}.${params.pathname}.${hashBody(params.body)}`;
  return createHmac("sha256", getInternalSharedSecret()).update(payload).digest("hex");
}

async function requestDashboardRoadmap<T>(pathname: string, init?: RequestInit & { bodyString?: string }) {
  const baseUrl = getDashboardApiBaseUrl();
  const url = new URL(pathname, baseUrl);
  const method = (init?.method || "GET").toUpperCase();
  const bodyString = init?.bodyString ?? "";
  const timestamp = String(Date.now());
  const signature = buildRoadmapInternalSignature({
    timestamp,
    method,
    pathname: url.pathname,
    body: bodyString,
  });

  const response = await fetch(url.toString(), {
    ...init,
    cache: "no-store",
    headers: {
      "x-roadmap-timestamp": timestamp,
      "x-roadmap-signature": signature,
      ...(bodyString ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
    body: bodyString || init?.body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload?.error === "string" && payload.error ? payload.error : "Dashboard roadmap request failed."
    );
  }
  return payload as T;
}

/**
 * How long a roadmap's CRM payload is reused before being refetched.
 *
 * The published roadmap for a given slug changes rarely (an advisor
 * republishes it), but every page view previously made TWO uncached,
 * signed, server-side calls to the dashboard API before a single byte was
 * rendered, so a reload always paid the full round trip.
 *
 * `unstable_cache` rather than `fetch`-level caching on purpose: this route is
 * `dynamic = "force-dynamic"` (it reads the access cookie), and per Next's own
 * docs that is *equivalent to setting every `fetch()` to*
 * `{ cache: "no-store", next: { revalidate: 0 } }` plus
 * `fetchCache = "force-no-store"` — so fetch options here would be ignored.
 * `unstable_cache` memoizes the function's RESULT, which is unaffected by that.
 *
 * Tagged per slug so a publish can invalidate a single roadmap immediately via
 * `revalidateTag(roadmapCacheTag(slug))`; the 60s window is the backstop that
 * keeps data fresh even with no explicit invalidation.
 */
const ROADMAP_CACHE_SECONDS = 60;

export function roadmapCacheTag(slug: string) {
  return `roadmap:${slug}`;
}

export async function fetchDashboardRoadmapMeta(slug: string) {
  return unstable_cache(
    () => requestDashboardRoadmap<RoadmapMetaResponse>(`/api/internal/roadmaps/${slug}/meta`),
    ["roadmap-meta", slug],
    { tags: [roadmapCacheTag(slug)], revalidate: ROADMAP_CACHE_SECONDS },
  )();
}

export async function authenticateDashboardRoadmap(slug: string, password: string) {
  return requestDashboardRoadmap<{ ok: true; slug: string; companyName: string; publishedAt: string | null }>(
    `/api/internal/roadmaps/${slug}/auth`,
    {
      method: "POST",
      bodyString: JSON.stringify({ password }),
    }
  );
}

export async function fetchDashboardRoadmapSnapshot(slug: string) {
  return unstable_cache(
    () => requestDashboardRoadmap<RoadmapSnapshotResponse>(`/api/internal/roadmaps/${slug}/snapshot`),
    ["roadmap-snapshot", slug],
    { tags: [roadmapCacheTag(slug)], revalidate: ROADMAP_CACHE_SECONDS },
  )();
}

export async function fetchDashboardRoadmapDraftPreview(slug: string, roadmapId: string) {
  const pathname = `/api/internal/roadmaps/${slug}/draft?roadmapId=${encodeURIComponent(roadmapId)}`;
  return requestDashboardRoadmap<RoadmapDraftPreviewResponse>(pathname);
}
