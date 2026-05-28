import type { SmartTablePerformanceConfig } from "./types";

export const getSmartVirtualizationConfig = (
  rowCount: number
): SmartTablePerformanceConfig => {
  if (rowCount > 50) {
    return {
      mode: "virtualized",
      rowCount,
      pageSize: 100,
      virtualizationThreshold: 50,
      paginationThreshold: 50,
      estimatedRowHeight: 36,
      overscan: 20,
    };
  }

  return {
    mode: "standard",
    rowCount,
    pageSize: Math.max(10, rowCount || 10),
    virtualizationThreshold: 1000,
    paginationThreshold: 120,
    estimatedRowHeight: 36,
    overscan: 8,
  };
};
