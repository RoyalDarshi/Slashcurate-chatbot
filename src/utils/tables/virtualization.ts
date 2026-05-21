import type { SmartTablePerformanceConfig } from "./types";

export const getSmartVirtualizationConfig = (
  rowCount: number
): SmartTablePerformanceConfig => {
  if (rowCount > 1000) {
    return {
      mode: "virtualized",
      rowCount,
      pageSize: 100,
      virtualizationThreshold: 1000,
      paginationThreshold: 120,
      estimatedRowHeight: 46,
      overscan: 18,
    };
  }

  if (rowCount > 120) {
    return {
      mode: "paginated",
      rowCount,
      pageSize: 50,
      virtualizationThreshold: 1000,
      paginationThreshold: 120,
      estimatedRowHeight: 46,
      overscan: 12,
    };
  }

  return {
    mode: "standard",
    rowCount,
    pageSize: Math.max(10, rowCount || 10),
    virtualizationThreshold: 1000,
    paginationThreshold: 120,
    estimatedRowHeight: 46,
    overscan: 8,
  };
};
