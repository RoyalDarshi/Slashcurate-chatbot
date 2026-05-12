import { useMemo } from "react";
import { useTheme } from "../ThemeContext";
import {
  getSmartChartConfig,
  getSmartEChartsOption,
  type SmartChartConfig,
  type SmartChartOverrides,
} from "../utils/smartChart";

export interface UseSmartChartResult {
  config: SmartChartConfig;
  option: ReturnType<typeof getSmartEChartsOption>;
}

export const useSmartChart = (
  data: unknown[],
  overrides: SmartChartOverrides = {}
): UseSmartChartResult => {
  const { theme } = useTheme();

  const config = useMemo(
    () => getSmartChartConfig(data, overrides),
    [
      data,
      overrides.aggregate,
      overrides.chartType,
      overrides.enableTopN,
      overrides.forceAutoChartType,
      overrides.groupBy,
      overrides.orientation,
      overrides.topN,
      overrides.valueKey,
    ]
  );

  const option = useMemo(
    () => getSmartEChartsOption(config, theme),
    [config, theme]
  );

  return { config, option };
};
