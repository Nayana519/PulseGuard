import React, { useState } from "react";
import api from "../utils/api";

const FORM_ICONS = { pill: "💊", liquid: "🧴", injection: "💉" };
const FORM_COLORS = {
  pill: {
    bg: "#eae5ff",
    border: "#8b5cf6",
    text: "#6d28d9",
  },
  liquid: {
    bg: "#cffafe",
    border: "#06b6d4",
    text: "#0c4a6e",
  },
  injection: {
    bg: "#fee2e2",
    border: "#ef4444",
    text: "#7f1d1d",
  },
};

export default function MedCard({
  med,
  onUpdate,
  onSelect,
  isSelected,
  allMedications = [],
}) {
  const [logging, setLogging] = useState(false);
  const [showInteractionWarning, setShowInteractionWarning] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [interactionData, setInteractionData] = useState(null);

  const nextDose = med.next_dose_time ? new Date(med.next_dose_time) : null;
  const isOverdue = nextDose && nextDose < new Date();
  const isLowStock = med.current_stock <= med.stock_threshold;
  const formColor = FORM_COLORS[med.form] || FORM_COLORS.pill;
  const stockPct = Math.min(
    100,
    (med.current_stock / Math.max(med.stock_threshold * 5, 1)) * 100,
  );

  const minsOverdue = isOverdue
    ? Math.floor((new Date() - nextDose) / 60000)
    : 0;

  const logDose = async (status) => {
    // Check for active interactions before logging
    if (status === "taken" && allMedications.length > 1) {
      setPendingStatus(status);
      setLogging(true);

      try {
        const response = await api.post("/medications/check-interactions", {
          name: med.name,
        });

        if (response.data.critical_interactions?.length > 0) {
          setInteractionData(response.data);
          setShowInteractionWarning(true);
          setLogging(false);
          return;
        }
      } catch (err) {
        console.error("Failed to check interactions:", err);
      }

      setLoading(false);
    }

    // Proceed with logging
    setLogging(true);
    try {
      await api.post(`/doses/${med.id}/log`, { status });
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || "Error logging dose");
    } finally {
      setLogging(false);
    }
  };

  const borderColor = isSelected
    ? "#8b5cf6"
    : isOverdue
      ? "#dc2626"
      : isLowStock
        ? "#f59e0b"
        : "#d1d5db";

  const glowColor = isSelected
    ? "rgba(139,92,246,0.3)"
    : isOverdue
      ? "rgba(220,38,38,0.2)"
      : "transparent";

  return (
    <div
      onClick={() => onSelect(med.id === isSelected ? null : med.id)}
      className="rounded-2xl p-5 cursor-pointer transition-all duration-300 bg-white"
      style={{
        border: `2px solid ${borderColor}`,
        boxShadow: `0 4px 20px ${glowColor}${isSelected ? ", 0 0 20px rgba(139,92,246,0.4)" : ""}`,
      }}
    >
      <style>{`
        @keyframes overdue-flash {
          0%,100% { opacity:1; } 50% { opacity:0.5; }
        }
      `}</style>

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{
              background: formColor.bg,
              border: `2px solid ${formColor.border}`,
            }}
          >
            {FORM_ICONS[med.form] || "💊"}
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-base leading-tight">
              {med.name}
            </h3>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
              style={{
                background: formColor.bg,
                color: formColor.text,
                border: `2px solid ${formColor.border}`,
              }}
            >
              {med.form} · {med.dose_amount}
              {med.dose_unit}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1">
          {isOverdue && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{
                background: "#dc2626",
                border: "2px solid #7f1d1d",
                animation: "overdue-flash 1.5s ease-in-out infinite",
              }}
            >
              {minsOverdue}m overdue
            </span>
          )}
          {isLowStock && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{
                background: "#f59e0b",
                border: "2px solid #92400e",
              }}
            >
              Low Stock
            </span>
          )}
          {med.boxed_warnings && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{
                background: "#ef4444",
                border: "2px solid #7f1d1d",
              }}
            >
              ⚠ Box Warn
            </span>
          )}
        </div>
      </div>

      {/* Next dose time */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdue ? "bg-red-600" : "bg-green-600"}`}
          style={{
            boxShadow: isOverdue ? "0 0 8px #dc2626" : "0 0 8px #059669",
          }}
        />
        <span
          className={`text-xs font-bold ${isOverdue ? "text-red-700" : "text-gray-700"}`}
        >
          {nextDose
            ? isOverdue
              ? `Due at ${nextDose.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : `Next: ${nextDose.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Schedule not set"}
        </span>
        <div className="flex-1" />
        <span className="text-xs font-bold text-gray-600">
          every {med.frequency_hours}h
        </span>
      </div>

      {/* Stock bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-700 font-bold">Stock remaining</span>
          <span
            className={`font-bold ${isLowStock ? "text-red-600" : "text-gray-800"}`}
          >
            {med.current_stock} {med.dose_unit}
          </span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ background: "#e5e7eb" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${stockPct}%`,
              background: isLowStock
                ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                : "linear-gradient(90deg, #10b981, #059669)",
              boxShadow: isLowStock
                ? "0 0 10px rgba(245,158,11,0.6)"
                : "0 0 10px rgba(16,185,129,0.5)",
            }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          disabled={logging}
          onClick={() => logDose("taken")}
          className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-50 text-white hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            border: "2px solid #047857",
            boxShadow: logging ? "none" : "0 4px 12px rgba(16,185,129,0.4)",
          }}
          onMouseEnter={(e) =>
            (e.target.style.background =
              "linear-gradient(135deg, #059669, #047857)")
          }
          onMouseLeave={(e) =>
            (e.target.style.background =
              "linear-gradient(135deg, #10b981, #059669)")
          }
        >
          ✓ Taken
        </button>
        <button
          disabled={logging}
          onClick={() => logDose("skipped")}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-700 transition-all disabled:opacity-50 hover:bg-gray-100"
          style={{
            background: "#f3f4f6",
            border: "2px solid #d1d5db",
          }}
        >
          Skip
        </button>
      </div>

      {/* Interaction Warning Dialog */}
      {showInteractionWarning && interactionData && (
        <div
          className="fixed inset-0 z-[9997] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowInteractionWarning(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
              border: "3px solid #dc2626",
              boxShadow: "0 0 60px rgba(220, 38, 38, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-3 w-full" style={{ background: "#dc2626" }} />

            <div className="p-6">
              <h3 className="text-xl font-black text-red-900 mb-3">
                🚨 CRITICAL INTERACTION
              </h3>

              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {interactionData.critical_interactions?.map(
                  (interaction, idx) => (
                    <div
                      key={idx}
                      className="text-red-900 text-sm p-3 rounded-lg font-semibold border-2"
                      style={{
                        background: "#fef2f2",
                        borderColor: "#dc2626",
                      }}
                    >
                      <p className="font-black text-red-700">
                        {interaction.description}
                      </p>
                      <p className="text-xs text-red-600 mt-1 font-bold">
                        Severity: {interaction.severity?.toUpperCase()}
                      </p>
                    </div>
                  ),
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowInteractionWarning(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-red-700 text-sm transition-all hover:scale-105"
                  style={{
                    background: "#f3f4f6",
                    border: "2px solid #ef4444",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setLogging(true);
                    try {
                      await api.post(`/doses/${med.id}/log`, {
                        status: pendingStatus,
                      });
                      onUpdate();
                      setShowInteractionWarning(false);
                    } catch (err) {
                      alert("Error logging dose");
                    } finally {
                      setLogging(false);
                    }
                  }}
                  disabled={logging}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #dc2626, #991b1b)",
                    border: "2px solid #7f1d1d",
                    boxShadow: "0 4px 15px rgba(220, 38, 38, 0.4)",
                  }}
                >
                  {logging ? "Saving..." : "Confirm - Take Dose"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
