"use client";

import { useMemo, useState } from "react";
import type { BrowseFilterState, BrowseViewMode } from "@/types/navigation";
import { makeEmptyBrowseFilter, hasActiveFilters, activeFilterSummary } from "@/lib/navigation";

export function useBrowseState(initial?: Partial<BrowseFilterState>) {
  const [state, setState] = useState<BrowseFilterState>(() =>
    makeEmptyBrowseFilter(initial)
  );

  function setView(view: BrowseViewMode) {
    setState((prev) => ({ ...prev, view }));
  }

  function patch(next: Partial<BrowseFilterState>) {
    setState((prev) => ({ ...prev, ...next }));
  }

  function reset() {
    setState(makeEmptyBrowseFilter());
  }

  const isFiltered = useMemo(() => hasActiveFilters(state), [state]);
  const filterSummary = useMemo(() => activeFilterSummary(state), [state]);

  return {
    state,
    setView,
    patch,
    reset,
    isFiltered,
    filterSummary,
  };
}
