import { useState, useEffect, useCallback } from "react";

interface UseGraphDataProps {
    data: any[];
    groupBy?: string | null;
    aggregate?: "sum" | "count" | "avg" | "min" | "max" | null;
    valueKey?: string | null;
    chartType?: string;
}

interface GraphDataResult {
    graphData: any[];
    xKey: string | null;
    yKeys: string[];
    isValidGraphData: boolean;
    autoGroupBy: string | null;
    autoValueKey: string | null;
    validValueKeys: string[];
    groupByOptions: string[];
    formatKey: (key: any) => string;
}

export const useGraphData = ({
    data,
    groupBy,
    aggregate = "sum",
    valueKey,
    chartType = "bar",
}: UseGraphDataProps): GraphDataResult => {
    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);
    const [isValidGraphData, setIsValidGraphData] = useState<boolean>(false);
    const [autoGroupBy, setAutoGroupBy] = useState<string | null>(null);
    const [autoValueKey, setAutoValueKey] = useState<string | null>(null);

    // Helper to exclude irrelevant keys
    const isKeyExcluded = useCallback((key: string) => {
        const lowerKey = key.toLowerCase();
        return (
            /(id|code|number)$/.test(lowerKey) ||
            lowerKey.includes("date") ||
            lowerKey.includes("email") ||
            lowerKey.includes("address") ||
            lowerKey === "first_name" ||
            lowerKey === "last_name" ||
            lowerKey === "name" ||
            lowerKey.length < 3
        );
    }, []);

    // Auto-detect best GroupBy key
    const autoDetectBestGroupBy = useCallback(
        (rows: any[]): string | null => {
            if (!rows.length) return null;

            const sampleSize = Math.min(100, rows.length);
            const sample = rows.slice(0, sampleSize);
            const keys = Object.keys(sample[0]);

            // Priority check for branch_name
            if (
                keys.includes("branch_name") &&
                !isKeyExcluded("branch_name") &&
                new Set(sample.map((row) => row["branch_name"]).filter(Boolean)).size > 1
            ) {
                return "branch_name";
            }

            const scores: Record<string, number> = {};

            keys.forEach((key) => {
                if (isKeyExcluded(key)) return;

                // Check if key is categorical (string or boolean)
                const isCategorical = sample.some(
                    (row) =>
                        typeof row[key] === "string" || typeof row[key] === "boolean"
                );
                if (!isCategorical) return;

                const values = sample.map((row) => row[key]).filter(Boolean);
                const uniqueCount = new Set(values).size;

                // Skip if mostly unique (like IDs) or mostly same (single category)
                if (uniqueCount <= 1 || uniqueCount > sampleSize * 0.8) return;

                const nullCount =
                    values.length < sampleSize ? sampleSize - values.length : 0;
                const nullPenalty = nullCount / sampleSize;

                // Score based on reasonable cardinality (lower uniqueCount is better, but not 1)
                scores[key] = 1 / (uniqueCount + nullPenalty * 10);
            });

            const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
            return sorted.length ? sorted[0][0] : null;
        },
        [isKeyExcluded]
    );

    // Auto-detect best numeric keys for scatter
    const autoDetectScatterKeys = useCallback(
        (rows: any[]): { x: string | null; y: string | null } => {
            if (!rows.length) return { x: null, y: null };
            const keys = Object.keys(rows[0]);
            const numeric = keys.filter(
                (key) =>
                    !isKeyExcluded(key) &&
                    rows.every(
                        (row) =>
                            typeof row[key] === "number" ||
                            row[key] === null ||
                            row[key] === undefined
                    )
            );
            if (numeric.length >= 2) {
                return { x: numeric[0], y: numeric[1] };
            }
            return { x: null, y: null };
        },
        [isKeyExcluded]
    );

    // Transform data logic
    const transformDynamicData = useCallback(
        (
            rawData: any[],
            selectedGroupBy: string | null,
            selectedAggregate: string | null,
            selectedValueKey: string | null
        ) => {
            if (!rawData || rawData.length === 0) {
                return { data: [], keys: [], indexBy: "" };
            }

            const sample = rawData[0];
            const keys = Object.keys(sample);

            // Find numeric keys
            const numericKeys = keys.filter((k) => {
                const val = sample[k];
                return val !== null && val !== "" && !isNaN(Number(val));
            });

            const effectiveValueKey =
                selectedValueKey && numericKeys.includes(selectedValueKey)
                    ? selectedValueKey
                    : numericKeys[0];

            if (!effectiveValueKey && selectedAggregate !== "count") {
                return { data: [], keys: [], indexBy: "" };
            }

            // Find string keys for grouping
            let stringKeys = keys.filter(
                (k) => typeof sample[k] === "string" && k !== effectiveValueKey
            );

            if (stringKeys.length === 0) {
                rawData = rawData.map((item, idx) => ({
                    ...item,
                    label: `Item ${idx + 1}`,
                }));
                stringKeys = ["label"];
            }

            // Determine indexByKey (GroupBy) and stackByKey (Secondary Grouping)
            let indexByKey: string;
            let stackByKey: string | null = null;

            if (selectedGroupBy && (stringKeys.includes(selectedGroupBy) || selectedGroupBy === "label")) {
                indexByKey = selectedGroupBy;
                // Try to find a secondary key for stacking if applicable
                stackByKey = stringKeys.find((k) => k !== selectedGroupBy) || null;
            } else {
                // Fallback if no valid groupBy provided
                indexByKey = stringKeys[0];
                stackByKey = stringKeys.length > 1 ? stringKeys[1] : null;
            }

            if (!indexByKey) {
                return { data: [], keys: [], indexBy: "" };
            }

            // Special handling for Pie/Funnel/Treemap (Single Dimension)
            if (["pie", "funnel", "treemap"].includes(chartType)) {
                const grouped = rawData.reduce((acc, row) => {
                    const group = row[indexByKey];
                    const value = Number(row[effectiveValueKey]);

                    if (!acc[group]) {
                        acc[group] = { [indexByKey]: group, value: 0, count: 0 };
                    }

                    if (selectedAggregate === "count") {
                        acc[group].count += 1;
                        acc[group].value = acc[group].count;
                    } else if (selectedAggregate === "avg") {
                        acc[group].value += value;
                        acc[group].count += 1;
                    } else if (selectedAggregate === "min") {
                        acc[group].value =
                            acc[group].value === 0 ? value : Math.min(acc[group].value, value);
                    } else if (selectedAggregate === "max") {
                        acc[group].value = Math.max(acc[group].value, value);
                    } else {
                        acc[group].value += value; // Default sum
                    }
                    return acc;
                }, {});

                const finalData = Object.values(grouped).map((item: any) => {
                    if (selectedAggregate === "avg" && item.count > 0) {
                        item.value = item.value / item.count;
                    }
                    return item;
                });

                return {
                    data: finalData,
                    keys: ["value"],
                    indexBy: indexByKey,
                };
            }

            // Radar Chart Handling
            if (chartType === "radar") {
                const indicatorKeys = numericKeys.length >= 2 ? numericKeys : [effectiveValueKey];
                const grouped = rawData.reduce((acc, row) => {
                    const label = row[indexByKey];
                    if (!acc[label]) {
                        acc[label] = { [indexByKey]: label, values: {}, count: {} };
                        indicatorKeys.forEach(key => {
                            acc[label].values[key] = 0;
                            acc[label].count[key] = 0;
                        });
                    }

                    indicatorKeys.forEach(key => {
                        const value = Number(row[key]) || 0;
                        if (selectedAggregate === "count") {
                            acc[label].values[key] += 1;
                        } else if (selectedAggregate === "avg") {
                            acc[label].values[key] += value;
                            acc[label].count[key] += 1;
                        } else if (selectedAggregate === "min") {
                            acc[label].values[key] = acc[label].values[key] === 0 ? value : Math.min(acc[label].values[key], value);
                        } else if (selectedAggregate === "max") {
                            acc[label].values[key] = Math.max(acc[label].values[key], value);
                        } else {
                            acc[label].values[key] += value;
                        }
                    });
                    return acc;
                }, {});

                const finalData = Object.values(grouped).map((item: any) => {
                    const newItem = { ...item };
                    if (selectedAggregate === "avg") {
                        indicatorKeys.forEach(key => {
                            newItem.values[key] = newItem.count[key] ? newItem.values[key] / newItem.count[key] : 0;
                        });
                    }
                    return newItem;
                });

                return {
                    data: finalData,
                    keys: indicatorKeys,
                    indexBy: indexByKey
                };
            }


            // Scatter Chart Handling
            if (chartType === "scatter") {
                // For scatter, we want raw data but ensure x and y are present
                // indexByKey will be used as X, effectiveValueKey as Y
                // We don't aggregate for scatter usually
                const validData = rawData.filter(row => {
                    const x = row[indexByKey];
                    const y = row[effectiveValueKey];
                    return x !== null && x !== undefined && y !== null && y !== undefined && !isNaN(Number(x)) && !isNaN(Number(y));
                });

                return {
                    data: validData,
                    keys: [effectiveValueKey],
                    indexBy: indexByKey
                };
            }

            // Standard Bar/Line/Area Handling
            // Get unique stack values (series)
            const allStackValues = stackByKey
                ? [...new Set(rawData.map((row) => row[stackByKey]))].filter(
                    (v) => v !== undefined && v !== null
                )
                : ["value"];

            const grouped = rawData.reduce((acc, row) => {
                const label = row[indexByKey];
                const stack = stackByKey ? row[stackByKey] : "value";
                const value = Number(row[effectiveValueKey]);

                if (!acc[label]) {
                    acc[label] = { [indexByKey]: label };
                    allStackValues.forEach((type) => (acc[label][type] = 0));
                }

                if (selectedAggregate === "count") {
                    acc[label][stack] = (acc[label][stack] || 0) + 1;
                } else if (selectedAggregate === "avg") {
                    acc[label][stack] = (acc[label][stack] || 0) + value;
                    acc[label][`${stack}_count`] = (acc[label][`${stack}_count`] || 0) + 1;
                } else if (selectedAggregate === "min") {
                    acc[label][stack] =
                        acc[label][stack] !== 0
                            ? Math.min(acc[label][stack], value)
                            : value;
                } else if (selectedAggregate === "max") {
                    acc[label][stack] = Math.max(acc[label][stack], value);
                } else {
                    // sum
                    acc[label][stack] = (acc[label][stack] || 0) + value;
                }

                return acc;
            }, {});

            const finalData = Object.values(grouped).map((item: any) => {
                const newItem = { ...item };
                if (selectedAggregate === "avg") {
                    allStackValues.forEach((stack) => {
                        const count = newItem[`${stack}_count`] || 1;
                        newItem[stack] = newItem[stack] / count;
                        delete newItem[`${stack}_count`];
                    });
                }
                return newItem;
            });

            return {
                data: finalData,
                keys: allStackValues,
                indexBy: indexByKey,
            };
        },
        [chartType]
    );

    useEffect(() => {
        if (!data || data.length === 0) {
            setGraphData([]);
            setXKey(null);
            setYKeys([]);
            setIsValidGraphData(false);
            return;
        }

        // Auto-detect groupBy and valueKey if not provided
        let effectiveGroupBy = groupBy;
        let effectiveValueKey = valueKey;

        if (!effectiveGroupBy) {
            if (chartType === 'scatter') {
                const { x } = autoDetectScatterKeys(data);
                if (x) {
                    effectiveGroupBy = x;
                    setAutoGroupBy(x);
                }
            } else {
                const detected = autoDetectBestGroupBy(data);
                if (detected) {
                    effectiveGroupBy = detected;
                    setAutoGroupBy(detected);
                } else {
                    // Fallback to first string key
                    const sample = data[0];
                    const stringKeys = Object.keys(sample).filter(
                        k => typeof sample[k] === 'string' && !isKeyExcluded(k)
                    );
                    if (stringKeys.length > 0) {
                        effectiveGroupBy = stringKeys[0];
                        setAutoGroupBy(stringKeys[0]);
                    }
                }
            }
        }

        if (!effectiveValueKey && aggregate !== 'count') {
            if (chartType === 'scatter') {
                const { y } = autoDetectScatterKeys(data);
                if (y) {
                    effectiveValueKey = y;
                    setAutoValueKey(y);
                }
            } else {
                const sample = data[0];
                const numericKeys = Object.keys(sample).filter(
                    k => typeof sample[k] === 'number' && !isKeyExcluded(k)
                );
                if (numericKeys.length > 0) {
                    effectiveValueKey = numericKeys[0];
                    setAutoValueKey(numericKeys[0]);
                }
            }
        }

        try {
            const {
                data: processedData,
                keys: processedKeys,
                indexBy,
            } = transformDynamicData(
                data,
                effectiveGroupBy || null,
                aggregate || "sum",
                effectiveValueKey || null
            );

            const isRadarValid = chartType === 'radar' ? processedData.length > 0 && processedKeys.length >= 1 : true;

            if (!processedData.length || !indexBy || !processedKeys.length || !isRadarValid) {
                setIsValidGraphData(false);
                return;
            }

            // Check for valid numeric data
            const hasValidNumericData = processedData.some((item) =>
                processedKeys.some((key) => {
                    const value = chartType === 'radar' ? item.values[key] : item[key];
                    return !isNaN(Number(value));
                })
            );

            if (!hasValidNumericData) {
                setIsValidGraphData(false);
                return;
            }

            setGraphData(processedData);
            setXKey(indexBy);
            setYKeys(processedKeys);
            setIsValidGraphData(true);
        } catch (error) {
            console.error("Data processing error:", error);
            setIsValidGraphData(false);
        }
    }, [data, groupBy, aggregate, valueKey, chartType, autoDetectBestGroupBy, autoDetectScatterKeys, isKeyExcluded, transformDynamicData]);

    // Helper to format keys for display
    const formatKey = useCallback((key: any): string => {
        if (key === null || key === undefined) return "";
        const stringKey = String(key);
        return stringKey
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    }, []);

    const [validValueKeys, setValidValueKeys] = useState<string[]>([]);
    const [groupByOptions, setGroupByOptions] = useState<string[]>([]);

    useEffect(() => {
        if (!data || data.length === 0) {
            setValidValueKeys([]);
            setGroupByOptions([]);
            return;
        }
        const sample = data[0];
        const keys = Object.keys(sample);

        const numeric = keys.filter(k => {
            const val = sample[k];
            return (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)))) && !isKeyExcluded(k);
        });
        setValidValueKeys(numeric);

        const stringKeys = keys.filter(k => !isKeyExcluded(k));
        setGroupByOptions(stringKeys);

    }, [data, isKeyExcluded]);

    return {
        graphData,
        xKey,
        yKeys,
        isValidGraphData,
        autoGroupBy,
        autoValueKey,
        validValueKeys,
        groupByOptions,
        formatKey
    };
};
