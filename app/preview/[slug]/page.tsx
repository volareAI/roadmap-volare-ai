import { notFound } from "next/navigation";
import { PublicRoadmapPage } from "@/components/roadmap/PublicRoadmapPage";
import { fetchDashboardRoadmapDraftPreview } from "@/lib/dashboard-roadmap-client";
import { verifyRoadmapPreviewSignature } from "@/lib/roadmap-preview";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

function readSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RoadmapPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: PageSearchParams;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const roadmapId = readSingleParam(resolvedSearchParams.roadmapId)?.trim() || "";
  const expires = readSingleParam(resolvedSearchParams.expires)?.trim() || "";
  const signature = readSingleParam(resolvedSearchParams.signature)?.trim() || "";

  if (
    !verifyRoadmapPreviewSignature({
      roadmapId,
      slug,
      expires,
      signature,
    })
  ) {
    notFound();
  }

  let draftPreview;
  try {
    draftPreview = await fetchDashboardRoadmapDraftPreview(slug, roadmapId);
  } catch {
    notFound();
  }

  return (
    <PublicRoadmapPage
      meta={{
        slug: draftPreview.slug,
        companyName: draftPreview.companyName,
        reportDateLabel: draftPreview.snapshot.company.reportDateLabel,
        publishedAt: draftPreview.publishedAt,
        templateVersion: draftPreview.templateVersion,
      }}
      snapshot={draftPreview.snapshot}
    />
  );
}
