import { createHash, createHmac } from "crypto";
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

export async function fetchDashboardRoadmapMeta(slug: string) {
  return requestDashboardRoadmap<RoadmapMetaResponse>(`/api/internal/roadmaps/${slug}/meta`);
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
  return requestDashboardRoadmap<RoadmapSnapshotResponse>(`/api/internal/roadmaps/${slug}/snapshot`);
}

export async function fetchDashboardRoadmapDraftPreview(slug: string, roadmapId: string) {
  const pathname = `/api/internal/roadmaps/${slug}/draft?roadmapId=${encodeURIComponent(roadmapId)}`;
  return requestDashboardRoadmap<RoadmapDraftPreviewResponse>(pathname);
}
