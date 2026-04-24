export const EMPTY_STATE_COPY = {
  resultsUnavailable: {
    title: "Results unavailable",
    body: "No real results data is available for the current selection.",
  },
  resultsEmpty: {
    title: "No results found",
    body: "There are no results for the current filters.",
  },
  nearbyVenuesEmpty: {
    title: "No nearby venues found",
    body: "No venues near your location matched the current filters.",
  },
  nearbyVenuesUnavailable: {
    title: "Nearby venues unavailable",
    body: "Nearby venue discovery could not be loaded right now.",
  },
  commercialEmpty: {
    title: "No commercial items",
    body: "There are no active commercial items for this placement right now.",
  },
} as const
