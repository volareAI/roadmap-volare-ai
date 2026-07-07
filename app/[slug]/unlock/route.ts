import { NextResponse } from "next/server";
import { authenticateDashboardRoadmap } from "@/lib/dashboard-roadmap-client";
import {
  ROADMAP_SESSION_MAX_AGE_SECONDS,
  createRoadmapSessionCookieValue,
  getRoadmapSessionCookieName,
} from "@/lib/roadmap-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function redirectToRoadmap(request: Request, slug: string, error?: string) {
  const target = new URL(`/${slug}`, request.url);
  if (error) {
    target.searchParams.set("error", error);
  }
  return NextResponse.redirect(target);
}

export async function POST(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const formData = await request.formData();
  const password = String(formData.get("password") || "").trim();

  if (!password) {
    return redirectToRoadmap(request, slug, "missing_password");
  }

  try {
    await authenticateDashboardRoadmap(slug, password);
  } catch {
    return redirectToRoadmap(request, slug, "incorrect_password");
  }

  const response = redirectToRoadmap(request, slug);
  response.cookies.set({
    name: getRoadmapSessionCookieName(slug),
    value: createRoadmapSessionCookieValue(slug),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ROADMAP_SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
