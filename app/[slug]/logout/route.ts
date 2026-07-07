import { NextResponse } from "next/server";
import { getRoadmapSessionCookieName } from "@/lib/roadmap-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const target = new URL(`/${slug}`, request.url);
  const response = NextResponse.redirect(target);

  response.cookies.set({
    name: getRoadmapSessionCookieName(slug),
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
