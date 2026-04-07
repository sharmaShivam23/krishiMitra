/**
 * Soil Intelligence Scoring Engine
 * ─────────────────────────────────
 * Computes soil health score, rating, insights,
 * crop recommendations, and fix suggestions.
 */

/* ───── Types ───── */

export type SoilValues = {
  ph?: number | null;
  moisture?: number | null;
  n?: number | null;
  p?: number | null;
  k?: number | null;
  ec?: number | null;
  organicCarbon?: number | null;
};

export type SoilIssue = {
  parameter: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  fix: string;
};

export type CropRecommendation = {
  cropName: string;
  confidence: number;
  reason: string;
};

export type SoilReport = {
  score: number;
  rating: string;
  insights: string[];
  issues: SoilIssue[];
  cropRecommendations: CropRecommendation[];
};

/* ───── Scoring Helpers ───── */

const scorePh = (ph?: number | null): number => {
  if (typeof ph !== 'number') return 0;
  if (ph >= 6.5 && ph <= 7.5) return 20;
  if ((ph >= 6.0 && ph < 6.5) || (ph > 7.5 && ph <= 8.0)) return 12;
  return 6;
};

const scoreNutrient = (val?: number | null, low = 180, high = 280): number => {
  if (typeof val !== 'number') return 0;
  if (val >= low && val <= high) return 15;
  if ((val >= low - 40 && val < low) || (val > high && val <= high + 40)) return 10;
  return 5;
};

const scoreOC = (val?: number | null): number => {
  if (typeof val !== 'number') return 0;
  if (val >= 0.75) return 15;
  if (val >= 0.5) return 10;
  return 5;
};

const scoreEC = (val?: number | null): number => {
  if (typeof val !== 'number') return 0;
  if (val <= 0.8) return 10;
  if (val <= 1.2) return 5;
  return 2;
};

const scoreMoisture = (val?: number | null): number => {
  if (typeof val !== 'number') return 0;
  if (val >= 15 && val <= 35) return 5;
  if ((val >= 10 && val < 15) || (val > 35 && val <= 45)) return 3;
  return 1;
};

/* ───── Main Scoring ───── */

export const computeSoilScore = (v: SoilValues): number => {
  return (
    scorePh(v.ph) +
    scoreNutrient(v.n, 180, 280) +
    scoreNutrient(v.p, 15, 35) +
    scoreNutrient(v.k, 140, 280) +
    scoreOC(v.organicCarbon) +
    scoreEC(v.ec) +
    scoreMoisture(v.moisture)
  );
};

export const getRating = (score: number): string => {
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Moderate';
  return 'Needs Improvement';
};

/* ───── Issue Detection ───── */

export const detectIssues = (v: SoilValues): SoilIssue[] => {
  const issues: SoilIssue[] = [];

  // pH issues
  if (typeof v.ph === 'number') {
    if (v.ph < 5.5) {
      issues.push({
        parameter: 'pH',
        severity: 'critical',
        description: 'Soil is very acidic (pH < 5.5)',
        fix: 'Apply agricultural lime at 2-3 kg per acre to raise pH. Retest after 2 months.',
      });
    } else if (v.ph < 6.5) {
      issues.push({
        parameter: 'pH',
        severity: 'warning',
        description: 'Soil is slightly acidic (pH 5.5-6.5)',
        fix: 'Apply lime at 1-2 kg per acre. Add organic compost to buffer acidity.',
      });
    } else if (v.ph > 8.5) {
      issues.push({
        parameter: 'pH',
        severity: 'critical',
        description: 'Soil is very alkaline (pH > 8.5)',
        fix: 'Apply gypsum at 2-4 kg per acre. Use sulfur-based amendments.',
      });
    } else if (v.ph > 7.5) {
      issues.push({
        parameter: 'pH',
        severity: 'warning',
        description: 'Soil is slightly alkaline (pH 7.5-8.5)',
        fix: 'Add organic matter like compost or green manure. Consider gypsum application.',
      });
    }
  }

  // Nitrogen
  if (typeof v.n === 'number' && v.n < 180) {
    issues.push({
      parameter: 'Nitrogen (N)',
      severity: v.n < 120 ? 'critical' : 'warning',
      description: `Low nitrogen level (${v.n} kg/ha)`,
      fix: 'Apply urea or ammonium sulfate. Use green manure crops like dhaincha or moong.',
    });
  }

  // Phosphorus
  if (typeof v.p === 'number' && v.p < 15) {
    issues.push({
      parameter: 'Phosphorus (P)',
      severity: v.p < 8 ? 'critical' : 'warning',
      description: `Low phosphorus level (${v.p} kg/ha)`,
      fix: 'Apply single superphosphate (SSP) or DAP. Add bone meal for organic option.',
    });
  }

  // Potassium
  if (typeof v.k === 'number' && v.k < 140) {
    issues.push({
      parameter: 'Potassium (K)',
      severity: v.k < 100 ? 'critical' : 'warning',
      description: `Low potassium level (${v.k} kg/ha)`,
      fix: 'Apply muriate of potash (MOP). Add wood ash as organic alternative.',
    });
  }

  // EC
  if (typeof v.ec === 'number' && v.ec > 1.2) {
    issues.push({
      parameter: 'EC (Salinity)',
      severity: v.ec > 2.0 ? 'critical' : 'warning',
      description: `High salinity (EC: ${v.ec} dS/m)`,
      fix: 'Improve drainage. Apply gypsum and flush soil with irrigation water.',
    });
  }

  // Organic Carbon
  if (typeof v.organicCarbon === 'number' && v.organicCarbon < 0.5) {
    issues.push({
      parameter: 'Organic Carbon',
      severity: v.organicCarbon < 0.3 ? 'critical' : 'warning',
      description: `Low organic carbon (${v.organicCarbon}%)`,
      fix: 'Add farmyard manure, vermicompost, or green manure. Practice crop residue incorporation.',
    });
  }

  // Moisture
  if (typeof v.moisture === 'number') {
    if (v.moisture < 10) {
      issues.push({
        parameter: 'Moisture',
        severity: 'warning',
        description: `Very low soil moisture (${v.moisture}%)`,
        fix: 'Increase irrigation frequency. Apply mulch to retain moisture.',
      });
    } else if (v.moisture > 45) {
      issues.push({
        parameter: 'Moisture',
        severity: 'warning',
        description: `Excessive soil moisture (${v.moisture}%)`,
        fix: 'Improve field drainage. Consider raised bed farming.',
      });
    }
  }

  if (issues.length === 0) {
    issues.push({
      parameter: 'Overall',
      severity: 'info',
      description: 'No significant issues detected',
      fix: 'Continue current soil management practices. Retest in 4 months.',
    });
  }

  return issues;
};

/* ───── Insights ───── */

export const buildInsights = (v: SoilValues): string[] => {
  const insights: string[] = [];

  if (typeof v.ph === 'number') {
    if (v.ph >= 6.5 && v.ph <= 7.5) insights.push('pH is in the optimal range for most crops.');
    else if (v.ph < 6.5) insights.push('Acidic soil — consider crops like rice, tea, or blueberries.');
    else insights.push('Alkaline soil — suitable for crops like barley, cotton, or sugar beet.');
  }

  if (typeof v.n === 'number' && v.n >= 280) insights.push('Excellent nitrogen levels — good for leafy vegetables.');
  if (typeof v.p === 'number' && v.p >= 30) insights.push('Strong phosphorus — supports root development and flowering.');
  if (typeof v.k === 'number' && v.k >= 250) insights.push('High potassium — great for fruit crops and drought resistance.');
  if (typeof v.organicCarbon === 'number' && v.organicCarbon >= 0.75) insights.push('Good organic carbon — indicates healthy soil biology.');

  if (insights.length === 0) insights.push('Add pH, moisture, and nutrient data to unlock detailed insights.');

  return insights;
};

/* ───── Crop Recommendations (Static Rule-Based) ───── */

const CROP_DATABASE: Array<{
  name: string;
  phRange: [number, number];
  minN?: number;
  minP?: number;
  minK?: number;
  soilTypes?: string[];
  seasons?: string[];
}> = [
  { name: 'Rice (Paddy)', phRange: [5.5, 7.5], minN: 150, minP: 10, minK: 100, soilTypes: ['Alluvial', 'Clay', 'Loamy'] },
  { name: 'Wheat', phRange: [6.0, 8.0], minN: 160, minP: 12, minK: 120, soilTypes: ['Alluvial', 'Loamy', 'Black'] },
  { name: 'Mustard', phRange: [6.0, 8.0], minN: 120, minP: 15, minK: 100, soilTypes: ['Alluvial', 'Sandy', 'Loamy'] },
  { name: 'Sugarcane', phRange: [6.0, 8.0], minN: 200, minP: 20, minK: 150, soilTypes: ['Alluvial', 'Black', 'Loamy'] },
  { name: 'Cotton', phRange: [6.5, 8.5], minN: 140, minP: 15, minK: 120, soilTypes: ['Black', 'Alluvial'] },
  { name: 'Soybean', phRange: [6.0, 7.5], minN: 100, minP: 15, minK: 120, soilTypes: ['Black', 'Loamy', 'Red'] },
  { name: 'Maize', phRange: [5.5, 7.5], minN: 150, minP: 12, minK: 100, soilTypes: ['Alluvial', 'Red', 'Loamy'] },
  { name: 'Potato', phRange: [5.0, 6.5], minN: 180, minP: 20, minK: 150, soilTypes: ['Alluvial', 'Sandy', 'Loamy'] },
  { name: 'Tomato', phRange: [6.0, 7.0], minN: 150, minP: 18, minK: 140, soilTypes: ['Alluvial', 'Sandy', 'Loamy'] },
  { name: 'Groundnut', phRange: [6.0, 7.5], minN: 100, minP: 15, minK: 100, soilTypes: ['Sandy', 'Red', 'Laterite'] },
  { name: 'Turmeric', phRange: [6.0, 7.5], minN: 140, minP: 15, minK: 120, soilTypes: ['Alluvial', 'Red', 'Loamy'] },
  { name: 'Chickpea (Chana)', phRange: [6.0, 8.0], minN: 100, minP: 12, minK: 100, soilTypes: ['Black', 'Loamy', 'Alluvial'] },
  { name: 'Tea', phRange: [4.5, 5.8], minN: 130, soilTypes: ['Red', 'Laterite'] },
  { name: 'Millets (Bajra)', phRange: [6.5, 8.0], minN: 80, soilTypes: ['Sandy', 'Red', 'Laterite'] },
];

export const recommendCrops = (v: SoilValues, soilType?: string): CropRecommendation[] => {
  const recs: CropRecommendation[] = [];

  for (const crop of CROP_DATABASE) {
    let confidence = 50; // base
    const reasons: string[] = [];

    // pH match
    if (typeof v.ph === 'number') {
      if (v.ph >= crop.phRange[0] && v.ph <= crop.phRange[1]) {
        confidence += 20;
        reasons.push('pH is in optimal range');
      } else {
        confidence -= 20;
      }
    }

    // Nutrient match
    if (typeof v.n === 'number' && crop.minN && v.n >= crop.minN) {
      confidence += 10;
      reasons.push('sufficient nitrogen');
    }
    if (typeof v.p === 'number' && crop.minP && v.p >= crop.minP) {
      confidence += 5;
      reasons.push('sufficient phosphorus');
    }
    if (typeof v.k === 'number' && crop.minK && v.k >= crop.minK) {
      confidence += 5;
      reasons.push('sufficient potassium');
    }

    // Soil type match
    if (soilType && crop.soilTypes?.includes(soilType)) {
      confidence += 10;
      reasons.push(`${soilType} soil is suitable`);
    }

    confidence = Math.min(95, Math.max(10, confidence));

    if (confidence >= 50) {
      recs.push({
        cropName: crop.name,
        confidence,
        reason: reasons.length > 0 ? reasons.join(', ') : 'general suitability',
      });
    }
  }

  return recs.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
};

/* ───── Full Report Generation ───── */

export const generateSoilReport = (v: SoilValues, soilType?: string): SoilReport => {
  const score = computeSoilScore(v);
  const rating = getRating(score);
  const insights = buildInsights(v);
  const issues = detectIssues(v);
  const cropRecommendations = recommendCrops(v, soilType);

  return { score, rating, insights, issues, cropRecommendations };
};

/* ───── Farmland Status Computation ───── */

const FOUR_MONTHS_MS = 1000 * 60 * 60 * 24 * 120;

export type FarmlandStatusResult = {
  status: 'draft' | 'ph-pending' | 'test-scheduled' | 'card-pending' | 'ready' | 'completed' | 'retest-due';
  progress: number;
  retestNeeded: boolean;
  shcExpired: boolean;
  nextRetestAt?: Date;
};

export const computeFarmlandStatus = (farmland: {
  landName?: string;
  location?: { state?: string; district?: string };
  phMoisture?: { ph?: number; moisture?: number; testedAt?: Date | string; nextRetestAt?: Date | string };
  scheduledTest?: { status?: string };
  soilHealthCard?: { values?: { n?: number; p?: number; k?: number }; validUntil?: Date | string };
  report?: { score?: number };
  now?: Date;
}): FarmlandStatusResult => {
  const now = farmland.now || new Date();
  const hasLand = Boolean(farmland.landName && farmland.location?.state && farmland.location?.district);
  const hasPh = typeof farmland.phMoisture?.ph === 'number';
  const hasMoisture = typeof farmland.phMoisture?.moisture === 'number';
  const hasPhMoisture = hasPh && hasMoisture;
  const hasShcValues = Boolean(
    farmland.soilHealthCard?.values &&
    typeof farmland.soilHealthCard.values.n === 'number'
  );
  const hasReport = typeof farmland.report?.score === 'number';

  // Retest check (4 months)
  const testedAt = farmland.phMoisture?.testedAt ? new Date(farmland.phMoisture.testedAt) : undefined;
  const retestNeeded = testedAt ? now.getTime() - testedAt.getTime() > FOUR_MONTHS_MS : false;
  const nextRetestAt = testedAt ? new Date(testedAt.getTime() + FOUR_MONTHS_MS) : undefined;

  // SHC expiry check
  const shcValidUntil = farmland.soilHealthCard?.validUntil ? new Date(farmland.soilHealthCard.validUntil) : undefined;
  const shcExpired = shcValidUntil ? now.getTime() > shcValidUntil.getTime() : false;

  if (!hasLand) return { status: 'draft', progress: 10, retestNeeded, shcExpired, nextRetestAt };
  if (retestNeeded && hasPhMoisture) return { status: 'retest-due', progress: 50, retestNeeded, shcExpired, nextRetestAt };

  const testScheduled = farmland.scheduledTest?.status === 'requested' || farmland.scheduledTest?.status === 'assigned';
  if (testScheduled) return { status: 'test-scheduled', progress: 35, retestNeeded, shcExpired, nextRetestAt };

  if (!hasPhMoisture) return { status: 'ph-pending', progress: 25, retestNeeded, shcExpired, nextRetestAt };
  if (!hasShcValues) return { status: 'card-pending', progress: 55, retestNeeded, shcExpired, nextRetestAt };
  if (!hasReport) return { status: 'ready', progress: 80, retestNeeded, shcExpired, nextRetestAt };

  return { status: 'completed', progress: 100, retestNeeded, shcExpired, nextRetestAt };
};
