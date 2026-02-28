import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useAlertPolling } from "../hooks/useAlertPolling";
import { useMedicationReminders } from "../hooks/useMedicationReminders";
import api from "../utils/api";
import SafetyLight from "../components/SafetyLight";
import EmergencyQR from "../components/EmergencyQR";
import MedCard from "../components/MedCard";
import AddMedicationModal from "../components/AddMedicationModal";
import UserProfileModal from "../components/UserProfileModal";
import ConcentrationGraph from "../components/ConcentrationGraph";
import ActiveInteractionWarning from "../components/ActiveInteractionWarning";

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const [meds, setMeds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showInteractionWarning, setShowInteractionWarning] = useState(false);
  const [pendingMedication, setPendingMedication] = useState(null);
  const [fatalInteractions, setFatalInteractions] = useState([]);

  const loadMeds = useCallback(async () => {
    try {
      const r = await api.get("/medications/");
      setMeds(r.data);
      // Check for fatal interactions among all current medications
      if (r.data.length > 1) {
        try {
          const pkRes = await api.get("/medications/check-pk-overlaps");
          if (pkRes.data.overlaps?.length > 0) {
            setFatalInteractions(pkRes.data.overlaps);
            return;
          }
        } catch (_) {}

        // Fallback: Check via post endpoint with each med
        const interactions = [];
        for (let i = 0; i < r.data.length; i++) {
          try {
            const checkRes = await api.post("/medications/check-interactions", {
              name: r.data[i].name,
              half_life_hours: r.data[i].half_life_hours || 6,
            });
            if (checkRes.data.critical_interactions?.length > 0) {
              if (!interactions.find((x) => x.med1 === r.data[i].name)) {
                interactions.push({
                  med1: r.data[i].name,
                  med2: "another current medication",
                  severity: "FATAL",
                  interactions: checkRes.data.critical_interactions,
                });
              }
            }
          } catch (_) {}
        }
        setFatalInteractions(interactions);
      } else {
        setFatalInteractions([]);
      }
    } catch (_) {}
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const r = await api.get("/alerts/?unread=true");
      setAlerts(r.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadMeds();
    loadAlerts();
  }, [loadMeds, loadAlerts]);
  useAlertPolling(setAlerts);
  useMedicationReminders(meds, (med) => {
    setPendingMedication(med);
    setShowInteractionWarning(true);
  });

  const missedCount = alerts.filter((a) => a.type === "missed_dose").length;
  const baseCompliance = Math.max(0, 100 - missedCount * 10);
  const compliance = fatalInteractions.length > 0 ? 0 : baseCompliance;
  const status =
    fatalInteractions.length > 0
      ? "red"
      : baseCompliance >= 80
        ? "green"
        : baseCompliance >= 60
          ? "yellow"
          : "red";
  const selectedMedObj = meds.find((m) => m.id === selectedMed);
  const lowStockCount = meds.filter(
    (m) => m.current_stock <= m.stock_threshold,
  ).length;

  const markAllRead = async () => {
    await api.put("/alerts/read-all");
    setAlerts([]);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #f5f3ff 100%)",
      }}
    >
      <style>{`
        @keyframes slide-in { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .dash-item { animation: fade-up 0.4s ease both; }
        @keyframes danger-pulse-btn { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `}</style>

      {/* Header */}
      <header
        className="sticky top-0 z-40 px-6 py-5 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%)",
          backdropFilter: "blur(16px)",
          borderBottom: "3px solid #3b82f6",
          boxShadow: "0 8px 32px rgba(30, 58, 138, 0.25)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              border: "2px solid #60a5fa",
              boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
            }}
          >
            💊
          </div>
          <div>
            <div className="font-black text-white text-lg">PulseGuard</div>
            <div className="text-sm text-blue-200">{user?.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfile(true)}
            className="p-3 rounded-xl transition-all hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
            title="View Profile"
          >
            <span className="text-xl">👤</span>
          </button>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-3 rounded-xl transition-all hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
            title="View Alerts"
          >
            <span className="text-xl">🔔</span>
            {alerts.length > 0 && (
              <span
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                style={{
                  background: "#dc2626",
                  boxShadow: "0 0 15px rgba(220, 38, 38, 0.8)",
                }}
              >
                {alerts.length > 9 ? "9+" : alerts.length}
              </span>
            )}
          </button>
          <button
            onClick={logout}
            className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Alerts panel */}
      {showAlerts && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1"
            onClick={() => setShowAlerts(false)}
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
            }}
          />
          <div
            className="w-96 overflow-y-auto flex flex-col"
            style={{
              background: "white",
              borderLeft: "3px solid #3b82f6",
              animation: "slide-in 0.3s ease",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
            }}
          >
            <div
              className="sticky top-0 p-6 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%)",
                borderBottom: "2px solid #3b82f6",
              }}
            >
              <span className="font-black text-white text-lg">
                Alerts & Notifications
              </span>
              {alerts.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-sm font-bold text-blue-300 hover:text-blue-200 transition-all"
                >
                  Mark read
                </button>
              )}
            </div>
            {alerts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-gray-700 text-base font-semibold">
                  No unread alerts
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-2xl border-2"
                    style={{
                      background:
                        a.severity === "critical"
                          ? "linear-gradient(135deg, #fef2f2, #fee2e2)"
                          : "linear-gradient(135deg, #fef3c7, #fde68a)",
                      border: `2px solid ${a.severity === "critical" ? "#f87171" : "#fbbf24"}`,
                    }}
                  >
                    <div className="font-bold text-gray-900 text-sm">
                      {a.severity === "critical" ? "⚠️" : "ℹ️"} {a.title}
                    </div>
                    <div className="text-gray-700 text-xs mt-2 leading-relaxed">
                      {a.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* FATAL INTERACTION ALERT */}
        {fatalInteractions.length > 0 && (
          <div
            className="dash-item rounded-3xl p-6 border-4"
            style={{
              background: "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
              borderColor: "#dc2626",
              boxShadow:
                "0 0 60px rgba(220, 38, 38, 0.4), inset 0 0 40px rgba(220, 38, 38, 0.08)",
              animationDelay: "0.02s",
            }}
          >
            <style>{`
              @keyframes danger-pulse {
                0%,100% { opacity:1; }
                50% { opacity:0.7; }
              }
            `}</style>
            <div className="flex items-start gap-6">
              <div
                className="text-6xl flex-shrink-0"
                style={{ animation: "danger-pulse 2s ease-in-out infinite" }}
              >
                ⚠️
              </div>
              <div className="flex-1">
                <div className="text-red-700 font-black text-2xl uppercase tracking-wider mb-3">
                  CRITICAL: Fatal Drug Interaction
                </div>
                <div className="space-y-3">
                  {fatalInteractions.map((interaction, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl p-4 border-2"
                      style={{
                        background: "linear-gradient(135deg, #fecaca, #fca5a5)",
                        border: "2px solid #dc2626",
                      }}
                    >
                      <div className="text-red-900 font-black text-base mb-1">
                        {interaction.med1} + {interaction.med2}
                      </div>
                      <div className="text-red-800 text-sm leading-relaxed font-semibold">
                        {interaction.interactions &&
                        Array.isArray(interaction.interactions) ? (
                          interaction.interactions
                            .slice(0, 1)
                            .map((i, idx) => (
                              <div key={idx}>
                                {typeof i === "string" ? i : i.description || i}
                              </div>
                            ))
                        ) : interaction.reason ? (
                          <div>{interaction.reason}</div>
                        ) : (
                          <div>Fatal drug interaction detected</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-red-900 text-base mt-4 font-black bg-white bg-opacity-60 p-4 rounded-xl border-2 border-red-700">
                  ⚡ IMMEDIATE ACTION REQUIRED: Contact your healthcare provider
                  immediately.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Safety light + QR */}
        <div className="dash-item" style={{ animationDelay: "0.05s" }}>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <SafetyLight
                status={status}
                compliancePercent={compliance}
                alertCount={alerts.length}
                fatalInteractions={fatalInteractions.length}
              />
            </div>
            <div className="flex lg:flex-col gap-3 lg:justify-center">
              <EmergencyQR user={user} medications={meds} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="dash-item grid grid-cols-3 gap-4"
          style={{ animationDelay: "0.1s" }}
        >
          {[
            {
              icon: "💊",
              value: meds.length,
              label: "Medications",
              color: "#3b82f6",
              bgColor: "#eff6ff",
              borderColor: "#3b82f6",
            },
            {
              icon: "⏰",
              value: meds.filter(
                (m) =>
                  m.next_dose_time && new Date(m.next_dose_time) < new Date(),
              ).length,
              label: "Overdue",
              color: "#dc2626",
              bgColor: "#fef2f2",
              borderColor: "#dc2626",
            },
            {
              icon: "📦",
              value: lowStockCount,
              label: "Low Stock",
              color: "#f59e0b",
              bgColor: "#fffbeb",
              borderColor: "#f59e0b",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 text-center border-3 font-bold"
              style={{
                background: s.bgColor,
                borderColor: s.borderColor,
                boxShadow: `0 4px 15px rgba(${s.color === "#3b82f6" ? "59, 130, 246" : s.color === "#dc2626" ? "220, 38, 38" : "245, 158, 11"}, 0.2)`,
              }}
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-black" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-gray-700 text-sm font-bold mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Medications header */}
        <div
          className="dash-item flex items-center justify-between"
          style={{ animationDelay: "0.15s" }}
        >
          <h2 className="text-gray-900 font-black text-2xl">My Medications</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white transition-all hover:scale-105 text-base"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              boxShadow: "0 6px 25px rgba(59, 130, 246, 0.4)",
            }}
          >
            <span>＋</span> Add Medication
          </button>
        </div>

        {/* Medications grid */}
        <div className="dash-item" style={{ animationDelay: "0.2s" }}>
          {meds.length === 0 ? (
            <div
              className="rounded-3xl p-16 text-center border-4 border-dashed"
              style={{
                background: "linear-gradient(135deg, #f0f9ff, #f5f3ff)",
                borderColor: "#3b82f6",
              }}
            >
              <div className="text-6xl mb-4">💊</div>
              <p className="text-gray-800 font-black text-lg mb-4">
                No medications added yet
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="text-blue-600 hover:text-blue-700 text-base font-bold transition-all hover:scale-105"
              >
                Add your first medication →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {meds.map((med, i) => (
                <div
                  key={med.id}
                  style={{ animation: `fade-up 0.3s ease ${i * 0.05}s both` }}
                >
                  <MedCard
                    med={med}
                    onUpdate={loadMeds}
                    onSelect={setSelectedMed}
                    isSelected={selectedMed}
                    allMedications={meds}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PK Graph */}
        <div className="dash-item" style={{ animationDelay: "0.25s" }}>
          <ConcentrationGraph
            medicationId={selectedMed}
            medicationName={selectedMedObj?.name}
          />
        </div>

        {/* FDA Encyclopedia */}
        {selectedMedObj &&
          (selectedMedObj.description ||
            selectedMedObj.side_effects ||
            selectedMedObj.boxed_warnings) && (
            <div
              className="dash-item rounded-3xl overflow-hidden border-3"
              style={{
                animationDelay: "0.3s",
                background: "white",
                borderColor: "#3b82f6",
                boxShadow: "0 8px 32px rgba(59, 130, 246, 0.15)",
              }}
            >
              <div
                className="px-6 py-5"
                style={{
                  background:
                    "linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%)",
                  borderBottom: "3px solid #3b82f6",
                }}
              >
                <p className="text-xs font-black tracking-widest text-blue-300 uppercase">
                  📚 Drug Encyclopedia
                </p>
                <h3 className="text-white font-black text-xl mt-2">
                  {selectedMedObj.name}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {selectedMedObj.boxed_warnings && (
                  <div
                    className="rounded-2xl p-5 border-3"
                    style={{
                      background: "#fef2f2",
                      borderColor: "#dc2626",
                    }}
                  >
                    <p className="text-xs font-black tracking-widest text-red-700 uppercase mb-2">
                      ⚠️ Boxed Warning (FDA)
                    </p>
                    <p className="text-red-900 text-sm leading-relaxed font-semibold">
                      {selectedMedObj.boxed_warnings}
                    </p>
                  </div>
                )}
                {selectedMedObj.description && (
                  <div
                    className="rounded-2xl p-5 border-3"
                    style={{
                      background: "#eff6ff",
                      borderColor: "#3b82f6",
                    }}
                  >
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                      📋 Indications
                    </p>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      {selectedMedObj.description}
                    </p>
                  </div>
                )}
                {selectedMedObj.side_effects && (
                  <div
                    className="rounded-2xl p-5 border-3"
                    style={{
                      background: "#fffbeb",
                      borderColor: "#f59e0b",
                    }}
                  >
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                      ⚡ Side Effects
                    </p>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      {selectedMedObj.side_effects}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
      </main>

      {showAdd && (
        <AddMedicationModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            loadMeds();
            loadAlerts();
          }}
        />
      )}

      {showProfile && (
        <UserProfileModal
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          user={user}
        />
      )}

      {showInteractionWarning && (
        <ActiveInteractionWarning
          medications={meds}
          onConfirm={() => setShowInteractionWarning(false)}
          onCancel={() => setShowInteractionWarning(false)}
        />
      )}
    </div>
  );
}
