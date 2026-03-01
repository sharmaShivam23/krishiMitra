export function analyzeMandiTrend(prices: any[]) {
  if (!prices.length) throw new Error("No price data");

  // sort oldest → newest
  prices.sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const lastPrices = prices.slice(-10);

  const first = lastPrices[0].modalPrice;
  const last = lastPrices[lastPrices.length - 1].modalPrice;

  /* ---------- TREND ---------- */
  const changePercent = ((last - first) / first) * 100;

  let trend: "increasing" | "decreasing" | "stable" = "stable";

  if (changePercent > 3) trend = "increasing";
  else if (changePercent < -3) trend = "decreasing";

  /* ---------- PREDICTION ---------- */

  const avgDailyChange =
    (last - first) / lastPrices.length;

  const predictedPrice = Math.round(
    last + avgDailyChange * 7
  );

  /* ---------- RISK ---------- */

  const variance =
    lastPrices.reduce(
      (sum, p) =>
        sum + Math.pow(p.modalPrice - last, 2),
      0
    ) / lastPrices.length;

  let riskLevel = "Low";
  if (variance > 2000) riskLevel = "High";
  else if (variance > 800) riskLevel = "Medium";

  /* ---------- SUGGESTION ---------- */

  let suggestion = "";

  if (trend === "increasing")
    suggestion =
      "Prices rising. Waiting may increase profit.";
  else if (trend === "decreasing")
    suggestion =
      "Prices falling. Selling soon is safer.";
  else
    suggestion =
      "Market stable. Sell based on storage ability.";

  return {
    currentPrice: last,
    predictedPrice,
    expectedRange: `${predictedPrice - 50} - ${
      predictedPrice + 50
    }`,
    trend,
    riskLevel,
    suggestion,
  };
}