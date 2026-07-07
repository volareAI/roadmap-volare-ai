export type RoadmapCategoryKey =
  | "financials"
  | "sales"
  | "marketing"
  | "leadership"
  | "recruiting"
  | "productivity";

export type RoadmapActionMonth = "M1" | "M2" | "M3";

export type RoadmapIndicator = {
  score: number | null;
  text: string;
};

export type RoadmapCategoryAction = {
  month: RoadmapActionMonth;
  headline: string;
  detail: string;
};

export type RoadmapPillarSummary = {
  key: RoadmapCategoryKey;
  label: string;
  scorePct: number | null;
  pointsEarned: number | null;
  pointsTotal: number | null;
};

export type RoadmapCategory = {
  key: RoadmapCategoryKey;
  label: string;
  subtitle: string;
  scorePct: number | null;
  pointsEarned: number | null;
  pointsTotal: number | null;
  focusMode: "actions" | "deferred";
  indicators: RoadmapIndicator[];
  actions: RoadmapCategoryAction[];
  deferredSummary: string;
  deferredNextSteps: string[];
};

export type RoadmapDraftJson = {
  company: {
    companyName: string;
    owners: string;
    industry: string;
    teamSizeLabel: string;
    reportDateLabel: string;
  };
  reportMeta: {
    sourceLabel: string;
    assessmentLabel: string;
    exitTimeline: string;
    exitGoalDisplay: string;
    profitMultipleDisplay: string;
    industryAverageMultipleDisplay: string;
    industryHighMultipleDisplay: string;
    pointsEarned: number | null;
    pointsTotal: number | null;
    summaryLead: string;
  };
  heroMetrics: {
    revenueDisplay: string;
    annualProfitDisplay: string;
    growthRateDisplay: string;
    healthScoreDisplay: string;
    healthScorePct: number | null;
    currentValueDisplay: string;
    valueTargetDisplay: string;
  };
  healthSummary: {
    lead: string;
    overallScorePct: number | null;
    pointsEarned: number | null;
    pointsTotal: number | null;
    pillars: RoadmapPillarSummary[];
  };
  valuationSummary: {
    currentValueDisplay: string;
    currentValueNote: string;
    industryAverageValueDisplay: string;
    industryAverageValueNote: string;
    industryHighValueDisplay: string;
    industryHighValueNote: string;
    valueGapDisplay: string;
    valueGapNote: string;
  };
  categories: RoadmapCategory[];
};

export type RoadmapMetaResponse = {
  slug: string;
  companyName: string;
  reportDateLabel: string;
  publishedAt: string | null;
  templateVersion: string;
};

export type RoadmapSnapshotResponse = {
  slug: string;
  companyName: string;
  publishedAt: string | null;
  templateVersion: string;
  snapshot: RoadmapDraftJson;
};

export type RoadmapDraftPreviewResponse = {
  slug: string;
  companyName: string;
  publishedAt: string | null;
  templateVersion: string;
  snapshot: RoadmapDraftJson;
};
