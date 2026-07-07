import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { fetchDashboardRoadmapMeta, fetchDashboardRoadmapSnapshot } from "@/lib/dashboard-roadmap-client";
import { getRoadmapSessionCookieName, verifyRoadmapSessionCookieValue } from "@/lib/roadmap-session";
import { PublicRoadmapPage, RoadmapPasswordGate } from "@/components/roadmap/PublicRoadmapPage";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

function readErrorMessage(rawError: string | string[] | undefined) {
  const value = Array.isArray(rawError) ? rawError[0] : rawError;
  if (value === "incorrect_password") {
    return "The password was incorrect. Check it with your advisor and try again.";
  }
  if (value === "missing_password") {
    return "Enter the roadmap password to continue.";
  }
  return null;
}

export default async function RoadmapSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: PageSearchParams;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  let meta;
  try {
    meta = await fetchDashboardRoadmapMeta(slug);
  } catch {
    notFound();
  }

  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(getRoadmapSessionCookieName(slug))?.value;
  const hasAccess = verifyRoadmapSessionCookieValue(slug, accessCookie);

  if (!hasAccess) {
    return (
      <RoadmapPasswordGate
        slug={slug}
        meta={meta}
        errorMessage={readErrorMessage(resolvedSearchParams.error)}
      />
    );
  }

  let roadmap;
  try {
    roadmap = await fetchDashboardRoadmapSnapshot(slug);
  } catch {
    notFound();
  }

  return <PublicRoadmapPage meta={meta} snapshot={roadmap.snapshot} />;
}
