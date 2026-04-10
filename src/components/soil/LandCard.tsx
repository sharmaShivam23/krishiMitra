"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  Leaf,
  FlaskConical,
  AlertTriangle,
} from "lucide-react";

type FarmlandCardData = {
  _id: string;
  landName: string;
  areaAcres?: number;
  soilType?: string;
  location?: { state?: string; district?: string; village?: string };
  status: string;
  progress: number;
  phMoisture?: {
    ph?: number;
    moisture?: number;
    testedAt?: string;
    nextRetestAt?: string;
  };
  report?: { score?: number; rating?: string };
  _statusMeta?: { retestNeeded?: boolean; shcExpired?: boolean };
};

/* Color schemes per soil type */
const SOIL_COLORS: Record<
  string,
  { from: string; to: string; text: string; light: string }
> = {
  Alluvial: {
    from: "from-emerald-700",
    to: "to-teal-600",
    text: "text-emerald-100",
    light: "bg-emerald-50",
  },
  Black: {
    from: "from-gray-800",
    to: "to-gray-700",
    text: "text-gray-200",
    light: "bg-gray-100",
  },
  Red: {
    from: "from-rose-700",
    to: "to-orange-600",
    text: "text-rose-100",
    light: "bg-rose-50",
  },
  Laterite: {
    from: "from-orange-700",
    to: "to-amber-600",
    text: "text-orange-100",
    light: "bg-orange-50",
  },
  Sandy: {
    from: "from-amber-600",
    to: "to-yellow-500",
    text: "text-amber-100",
    light: "bg-amber-50",
  },
  Clay: {
    from: "from-stone-700",
    to: "to-stone-600",
    text: "text-stone-200",
    light: "bg-stone-100",
  },
  Loamy: {
    from: "from-lime-700",
    to: "to-green-600",
    text: "text-lime-100",
    light: "bg-lime-50",
  },
};
const DEFAULT_SOIL = {
  from: "from-emerald-800",
  to: "to-emerald-700",
  text: "text-emerald-100",
  light: "bg-emerald-50",
};

const STATUS_MAP: Record<
  string,
  { labelKey: string; color: string; dot: string }
> = {
  draft: {
    labelKey: "status.completeSetup",
    color: "text-gray-600 bg-gray-50 border-gray-200",
    dot: "bg-gray-400",
  },
  "ph-pending": {
    labelKey: "status.addSoilTest",
    color: "text-orange-700 bg-orange-50 border-orange-200",
    dot: "bg-orange-400",
  },
  "test-scheduled": {
    labelKey: "status.testScheduled",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    dot: "bg-blue-400",
  },
  "card-pending": {
    labelKey: "status.uploadHealthCard",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
  },
  ready: {
    labelKey: "status.generateReport",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  completed: {
    labelKey: "status.viewReport",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  "retest-due": {
    labelKey: "status.retestNeeded",
    color: "text-red-700 bg-red-50 border-red-200",
    dot: "bg-red-500 animate-pulse",
  },
};

export default function LandCard({
  farm,
  onClick,
}: {
  farm: FarmlandCardData;
  onClick: () => void;
}) {
  const t = useTranslations("SoilLandCard");
  const soilTypeLabels: Record<string, string> = {
    alluvial: t("soilTypes.alluvial"),
    black: t("soilTypes.black"),
    red: t("soilTypes.red"),
    laterite: t("soilTypes.laterite"),
    sandy: t("soilTypes.sandy"),
    clay: t("soilTypes.clay"),
    loamy: t("soilTypes.loamy"),
  };
  const soil = SOIL_COLORS[farm.soilType || ""] || DEFAULT_SOIL;
  const st = STATUS_MAP[farm.status] || STATUS_MAP.draft;
  const hasScore = typeof farm.report?.score === "number";
  const hasPh = typeof farm.phMoisture?.ph === "number";
  const loc =
    [farm.location?.village, farm.location?.district]
      .filter(Boolean)
      .join(", ") ||
    farm.location?.state ||
    "";
  const soilTypeKey = farm.soilType
    ? farm.soilType.toLowerCase().replace(/\s+/g, "")
    : "";
  const soilTypeLabel = soilTypeKey ? soilTypeLabels[soilTypeKey] : "";
  const statusLabel = t(st.labelKey);
  const topBadgeLabel =
    farm.status === "retest-due" ? t("badges.retestDue") : t("badges.setup");

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group w-full rounded-[20px] bg-white border border-gray-100 text-left overflow-hidden shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-emerald-200 hover:shadow-emerald-900/5 transition-all duration-300 relative flex flex-col"
    >
      {/* Subtle top edge gradient based on Soil Type */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${soil.from} ${soil.to}`}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[17px] font-black text-gray-900 leading-tight truncate tracking-tight">
              {farm.landName}
            </h3>
            {loc && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-400 truncate">
                <MapPin className="w-3.5 h-3.5" /> {loc}
              </p>
            )}
          </div>

          {hasScore ? (
            <div
              className={`shrink-0 w-11 h-11 rounded-full border-[3px] border-emerald-50 bg-white flex flex-col items-center justify-center shadow-sm`}
            >
              <span className="text-[13px] font-black text-emerald-600 leading-none">
                {farm.report!.score}
              </span>
            </div>
          ) : (
            <div
              className={`shrink-0 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${st.color}`}
            >
              {topBadgeLabel}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-5">
          {farm.areaAcres && (
            <span className="inline-flex items-center rounded-lg bg-gray-50 border border-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">
              {farm.areaAcres} {t("tags.acres")}
            </span>
          )}
          {farm.soilType && (
            <span
              className={`inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-100/50 px-2 py-1 text-[11px] font-bold text-emerald-700`}
            >
              {soilTypeLabel || farm.soilType}
            </span>
          )}
          {hasPh && (
            <span className="inline-flex items-center rounded-lg bg-blue-50 border border-blue-100/50 px-2 py-1 text-[11px] font-bold text-blue-700">
              {t("tags.ph", { value: farm.phMoisture?.ph ?? 0 })}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-3.5 mt-auto border-t border-gray-50 bg-gray-50/50 flex items-center justify-between group-hover:bg-emerald-50/40 transition-colors">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${st.dot}`} />
          <span className="text-xs font-bold text-gray-700 group-hover:text-emerald-900 transition-colors">
            {statusLabel}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.button>
  );
}
