import type {
  RoadmapActionMonth,
  RoadmapCategoryKey,
  RoadmapDraftJson,
} from "@/lib/roadmap-types";

const ACTION_MONTHS: RoadmapActionMonth[] = ["M1", "M2", "M3"];
const CATEGORY_KEYS: RoadmapCategoryKey[] = [
  "financials",
  "sales",
  "marketing",
  "leadership",
  "recruiting",
  "productivity",
];

const actionMonthOrder = new Map(ACTION_MONTHS.map((month, index) => [month, index] as const));
const categoryOrder = new Map(CATEGORY_KEYS.map((key, index) => [key, index] as const));

export type RoadmapActionPlanItem = {
  month: RoadmapActionMonth;
  categoryLabel: string;
  categoryKey: RoadmapCategoryKey;
  headline: string;
  detail: string;
};

function hasDisplayableAction(action: { headline: string; detail: string }) {
  return Boolean(action.headline.trim() || action.detail.trim());
}

/**
 * Produces the advisor-approved actions in the exact order used by the client
 * roadmap: month first, then the standard category order, then action order.
 */
export function buildActionPlan(snapshot: RoadmapDraftJson): RoadmapActionPlanItem[] {
  return snapshot.categories
    .flatMap((category, categoryIndex) => {
      if (category.focusMode !== "actions" || category.actions.length === 0) {
        return [];
      }

      return category.actions
        .filter(hasDisplayableAction)
        .map((action, actionIndex) => ({
          month: action.month,
          categoryLabel: category.label.trim() || category.key,
          categoryKey: category.key,
          headline: action.headline.trim(),
          detail: action.detail.trim(),
          categoryIndex,
          actionIndex,
        }));
    })
    .sort((left, right) => {
      const monthDifference =
        (actionMonthOrder.get(left.month) ?? Number.MAX_SAFE_INTEGER) -
        (actionMonthOrder.get(right.month) ?? Number.MAX_SAFE_INTEGER);
      if (monthDifference !== 0) {
        return monthDifference;
      }

      const categoryDifference =
        (categoryOrder.get(left.categoryKey) ?? left.categoryIndex) -
        (categoryOrder.get(right.categoryKey) ?? right.categoryIndex);
      if (categoryDifference !== 0) {
        return categoryDifference;
      }

      return left.actionIndex - right.actionIndex;
    })
    .map(({ categoryIndex: _categoryIndex, actionIndex: _actionIndex, ...action }) => action);
}

export const ACTION_PLAN_MONTHS = ACTION_MONTHS;
