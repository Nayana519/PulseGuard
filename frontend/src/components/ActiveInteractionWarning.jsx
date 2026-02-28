import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function ActiveInteractionWarning({
  medications,
  onConfirm,
  onCancel,
}) {
  const [activeInteractions, setActiveInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState(null);

  useEffect(() => {
    checkAllInteractions();
  }, [medications]);

  const checkAllInteractions = async () => {
    if (medications.length < 2) return;

    setLoading(true);
    const interactions = [];

    // Check interactions between all active medications
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const med1 = medications[i];
        const med2 = medications[j];

        if (med1.rxcui && med2.rxcui) {
          try {
            const response = await api.post("/medications/check-interactions", {
              name: med1.name,
              patient_id: null,
            });

            if (response.data.critical_interactions?.length > 0) {
              for (const interaction of response.data.critical_interactions) {
                interactions.push({
                  med1: med1.name,
                  med2: med2.name,
                  severity: interaction.severity,
                  description: interaction.description,
                  drugs: interaction.drugs,
                });
              }
            }
          } catch (err) {
            console.error("Failed to check interaction:", err);
          }
        }
      }
    }

    setActiveInteractions(interactions);
    setLoading(false);
  };

  if (!activeInteractions.length) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <style>{`
        @keyframes shake-danger {
          0%, 100% { transform: translateX(0) scale(1); }
          25% { transform: translateX(-8px) scale(1.02); }
          75% { transform: translateX(8px) scale(1.02); }
        }
        @keyframes pulse-danger {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2d0a0a 0%, #1a0505 100%)",
          border: "2px solid rgba(239,68,68,0.6)",
          boxShadow: "0 0 80px rgba(239,68,68,0.4)",
          animation: "shake-danger 0.6s ease-in-out",
        }}
      >
        <div
          className="h-2 w-full"
          style={{
            background:
              "repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #7f1d1d 10px, #7f1d1d 20px)",
            animation: "pulse-danger 1s ease-in-out infinite",
          }}
        />

        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "2px solid rgba(239,68,68,0.4)",
                animation: "pulse-danger 1.5s ease-in-out infinite",
              }}
            >
              ⚠️
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                ACTIVE INTERACTION WARNING
              </h2>
              <p className="text-red-300 text-sm mt-1">
                Your current medications have dangerous interactions
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6 max-h-56 overflow-y-auto">
            {activeInteractions.map((interaction, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <div className="text-red-300 font-bold text-sm mb-1">
                  🚨 {interaction.med1} + {interaction.med2}
                </div>
                <div className="text-red-200 text-xs mb-2">
                  {interaction.description}
                </div>
                <div className="text-xs text-red-400 font-semibold">
                  Severity: {interaction.severity?.toUpperCase() || "HIGH"}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-200 text-xs leading-relaxed">
              <span className="font-bold">Immediate Action Required:</span>{" "}
              These medication combinations pose a serious health risk. Consult
              your healthcare provider before continuing.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white transition-all"
              style={{
                background: "rgba(239,68,68,0.2)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
              }}
            >
              Cancel & Review
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 0 20px rgba(239,68,68,0.5)",
              }}
            >
              {loading ? "Checking..." : "I Understand - Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
