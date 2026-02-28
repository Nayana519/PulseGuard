import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useAlertPolling } from "../hooks/useAlertPolling";
import api from "../utils/api";
import ViewPatientProfileModal from "../components/ViewPatientProfileModal";

const STATUS = {
  green: {
    label: "Stable",
    dot: "#10b981",
    glow: "rgba(16,185,129,0.5)",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
    border: "2px solid #10b981",
    textColor: "#047857",
  },
  yellow: {
    label: "Attention",
    dot: "#f59e0b",
    glow: "rgba(245,158,11,0.5)",
    bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    border: "2px solid #f59e0b",
    textColor: "#a16207",
  },
  red: {
    label: "Critical",
    dot: "#dc2626",
    glow: "rgba(220,38,38,0.6)",
    bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    border: "2px solid #dc2626",
    textColor: "#991b1b",
  },
};

export default function CaregiverDashboard() {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkMsg, setLinkMsg] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);

  const loadPatients = useCallback(async () => {
    try {
      const r = await api.get("/caregiver/patients");
      setPatients(r.data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const r = await api.get("/alerts/?unread=true");
      setAlerts(r.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadPatients();
    loadAlerts();
  }, [loadPatients, loadAlerts]);
  useAlertPolling(setAlerts);

  const linkPatient = async (e) => {
    e.preventDefault();
    try {
      await api.post("/caregiver/link-patient", { patient_email: linkEmail });
      setLinkMsg("✓ Patient linked!");
      setLinkEmail("");
      loadPatients();
    } catch (err) {
      setLinkMsg(err.response?.data?.error || "Failed to link");
    }
  };

  const markAllRead = async () => {
    await api.put("/alerts/read-all");
    setAlerts([]);
  };

  const criticalCount = patients.filter((p) => p.status === "red").length;
  const missedCount = patients.filter((p) => p.has_missed_dose).length;
  const lowStockCount = patients.filter(
    (p) => p.low_stock_meds?.length > 0,
  ).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #f5f3ff 100%)" }}>
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.3)} }
        .patient-card { animation: fade-up 0.35s ease both; }
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
            👨‍⚕️
          </div>
          <div>
            <div className="font-blue text-white text-lg">Medivia</div>
            <div className="text-sm text-blue-200">
              Caregiver Portal · {user?.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLink(!showLink)}
            className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.3)",
              color: "#e0f2fe",
            }}
          >
            + Link Patient
          </button>
          <button
            className="p-3 rounded-xl transition-all hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
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

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Link patient */}
        {showLink && (
          <div
            className="rounded-3xl p-6"
            style={{
              background: "linear-gradient(135deg, #eff6ff, #f0f9ff)",
              border: "3px solid #3b82f6",
              animation: "fade-up 0.3s ease",
              boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15)",
            }}
          >
            <p className="text-xs font-black tracking-widest text-blue-700 uppercase mb-4">
              🔗 Link a Patient to Monitor
            </p>
            <form onSubmit={linkPatient} className="flex gap-3">
              <input
                className="flex-1 rounded-xl px-5 py-3 text-gray-900 text-sm font-semibold placeholder-gray-500 focus:outline-none border-2 focus:border-blue-500"
                style={{
                  background: "white",
                  border: "2px solid #e5e7eb",
                }}
                placeholder="Enter patient's email address…"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-black text-white transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                }}
              >
                Link
              </button>
            </form>
            {linkMsg && (
              <p
                className={`text-sm font-bold mt-3 ${linkMsg.startsWith("✓") ? "text-green-700" : "text-red-700"}`}
              >
                {linkMsg}
              </p>
            )}
          </div>
        )}

        {/* Summary stats */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ animation: "fade-up 0.3s ease 0.05s both" }}
        >
          {[
            {
              icon: "👥",
              value: patients.length,
              label: "Patients",
              color: "#3b82f6",
              bgColor: "#eff6ff",
              borderColor: "#3b82f6",
            },
            {
              icon: "🚨",
              value: criticalCount,
              label: "Critical",
              color: "#dc2626",
              bgColor: "#fef2f2",
              borderColor: "#dc2626",
            },
            {
              icon: "⏰",
              value: missedCount,
              label: "Missed Doses",
              color: "#ea580c",
              bgColor: "#fff7ed",
              borderColor: "#ea580c",
            },
            {
              icon: "📦",
              value: lowStockCount,
              label: "Low Stock",
              color: "#b45309",
              bgColor: "#fffbeb",
              borderColor: "#b45309",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 text-center border-3 font-bold"
              style={{
                background: s.bgColor,
                borderColor: s.borderColor,
                boxShadow: `0 4px 15px rgba(${s.color === "#3b82f6" ? "59, 130, 246" : s.color === "#dc2626" ? "220, 38, 38" : s.color === "#ea580c" ? "234, 88, 12" : "180, 83, 9"}, 0.2)`,
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

        {/* Unread alerts */}
        {alerts.length > 0 && (
          <div
            className="rounded-3xl p-6 border-3"
            style={{
              animation: "fade-up 0.3s ease 0.1s both",
              background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
              borderColor: "#dc2626",
              boxShadow: "0 4px 20px rgba(220, 38, 38, 0.15)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-black tracking-widest text-red-700 uppercase">
                🚨 {alerts.length} Alert{alerts.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={markAllRead}
                className="text-sm font-bold text-red-700 hover:text-red-900 transition-all"
              >
                Mark read
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm bg-white bg-opacity-60 p-3 rounded-lg">
                  <span className="text-base flex-shrink-0">
                    {a.type === "missed_dose"
                      ? "⏰"
                      : a.type === "low_stock"
                        ? "📦"
                        : "⚠️"}
                  </span>
                  <div>
                    <span className="font-bold text-gray-900">{a.title}</span>
                    <span className="text-gray-700"> — {a.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient list */}
        <div style={{ animation: "fade-up 0.3s ease 0.15s both" }}>
          <h2 className="text-gray-900 font-black text-2xl mb-6">
            👥 Patient Monitor
          </h2>

          {loading ? (
            <div className="text-center py-16 text-gray-600 font-semibold">
              Loading patients…
            </div>
          ) : patients.length === 0 ? (
            <div
              className="rounded-3xl p-16 text-center border-4 border-dashed"
              style={{
                background: "linear-gradient(135deg, #f0f9ff, #f5f3ff)",
                borderColor: "#3b82f6",
              }}
            >
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-800 font-black text-lg mb-4">
                No patients linked yet
              </p>
              <button
                onClick={() => setShowLink(true)}
                className="text-blue-600 hover:text-blue-700 text-base font-bold transition-all hover:scale-105"
              >
                Link your first patient →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {patients.map((p, i) => {
                const sc = STATUS[p.status] || STATUS.green;
                const isExpanded = expanded === p.patient.id;

                return (
                  <div
                    key={p.patient.id}
                    className="patient-card rounded-3xl overflow-hidden transition-all border-3"
                    style={{
                      animationDelay: `${i * 0.06}s`,
                      background: sc.bg,
                      borderColor: sc.border.replace("2px solid ", ""),
                      boxShadow: `0 0 40px ${sc.glow}`,
                    }}
                  >
                    {/* Patient row */}
                    <div
                      className="p-6 cursor-pointer hover:bg-black hover:bg-opacity-5 transition-all"
                      onClick={() =>
                        setExpanded(isExpanded ? null : p.patient.id)
                      }
                    >
                      <div className="flex items-center gap-5">
                        {/* Avatar */}
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${sc.dot}, ${sc.dot}dd)`,
                            border: `2px solid ${sc.dot}`,
                            boxShadow: `0 4px 15px ${sc.glow}`,
                          }}
                        >
                          {p.patient.name[0]}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-gray-900 font-black text-lg">
                              {p.patient.name}
                            </span>
                            {/* Status badge */}
                            <span
                              className="text-xs font-black px-3 py-1.5 rounded-full border-2"
                              style={{
                                background: "white",
                                color: sc.dot,
                                borderColor: sc.dot,
                                boxShadow: `0 2px 8px ${sc.glow}`,
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 7,
                                  height: 7,
                                  borderRadius: "50%",
                                  background: sc.dot,
                                  boxShadow: `0 0 8px ${sc.dot}`,
                                  marginRight: 5,
                                  animation: "pulse-dot 2s infinite",
                                }}
                              />
                              {sc.label}
                            </span>
                          </div>
                          {/* Warning badges */}
                          <div className="flex gap-2 flex-wrap mt-2">
                            {p.has_missed_dose && (
                              <span
                                className="text-xs px-3 py-1.5 rounded-lg font-bold border"
                                style={{
                                  background: "#fff7ed",
                                  color: "#ea580c",
                                  border: "1px solid #ea580c",
                                }}
                              >
                                ⏰ Missed Dose
                              </span>
                            )}
                            {p.low_stock_meds?.map((med) => (
                              <span
                                key={med}
                                className="text-xs px-3 py-1.5 rounded-lg font-bold border"
                                style={{
                                  background: "#fffbeb",
                                  color: "#b45309",
                                  border: "1px solid #b45309",
                                }}
                              >
                                📦 {med}
                              </span>
                            ))}
                            {p.critical_alert_count > 0 && (
                              <span
                                className="text-xs px-3 py-1.5 rounded-lg font-bold border"
                                style={{
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  border: "1px solid #dc2626",
                                }}
                              >
                                ⚠️ {p.critical_alert_count} Critical
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Compliance */}
                        <div className="text-right flex-shrink-0">
                          <div
                            className="text-3xl font-black"
                            style={{ color: sc.dot }}
                          >
                            {p.compliance_percent}%
                          </div>
                          <div className="text-xs text-gray-600 font-bold">
                            compliance
                          </div>
                          <div className="text-sm text-gray-700 font-bold">
                            {p.medications.length} meds
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientProfile({
                                id: p.patient.id,
                                name: p.patient.name,
                              });
                              setShowPatientProfile(true);
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 underline mt-2 transition-all"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div
                        style={{
                          borderTop: `2px solid ${sc.border.replace("2px solid ", "")}`,
                          background: "white",
                          backgroundOpacity: "0.5",
                        }}
                        className="p-6"
                      >
                        <p className="text-xs font-black tracking-widest text-gray-700 uppercase mb-4">
                          💊 Medications
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {p.medications.map((med) => {
                            const isLow =
                              med.current_stock <= med.stock_threshold;
                            const isOverdue =
                              med.next_dose_time &&
                              new Date(med.next_dose_time) < new Date();
                            return (
                              <div
                                key={med.id}
                                className="rounded-2xl p-4 border-2"
                                style={{
                                  background: "white",
                                  borderColor: isOverdue ? "#dc2626" : isLow ? "#f59e0b" : "#e5e7eb",
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <span className="text-gray-900 font-bold text-sm">
                                    {med.name}
                                  </span>
                                  <div className="flex gap-2">
                                    {isOverdue && (
                                      <span className="text-xs text-white font-bold bg-red-600 px-2 py-1 rounded">
                                        Overdue
                                      </span>
                                    )}
                                    {isLow && (
                                      <span className="text-xs text-white font-bold bg-amber-600 px-2 py-1 rounded">
                                        Low
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-gray-700 text-xs mt-2 font-semibold">
                                  {med.dose_amount}
                                  {med.dose_unit} · every {med.frequency_hours}h
                                  · stock: {med.current_stock}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {p.active_alerts.length > 0 && (
                          <div className="mt-6">
                            <p className="text-xs font-black tracking-widest text-gray-700 uppercase mb-3">
                              📋 Recent Alerts
                            </p>
                            <div className="space-y-2">
                              {p.active_alerts.slice(0, 4).map((a) => (
                                <div
                                  key={a.id}
                                  className="flex items-center gap-3 text-sm p-3 rounded-lg"
                                  style={{
                                    background: a.severity === "critical" ? "#fef2f2" : "#fffbeb",
                                    borderLeft: `4px solid ${a.severity === "critical" ? "#dc2626" : "#f59e0b"}`,
                                  }}
                                >
                                  <span className="text-lg">
                                    {a.severity === "critical" ? "🚨" : "⚠️"}
                                  </span>
                                  <span className="text-gray-900 font-bold">
                                    {a.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showPatientProfile && selectedPatientProfile && (
        <ViewPatientProfileModal
          isOpen={showPatientProfile}
          onClose={() => setShowPatientProfile(false)}
          patientId={selectedPatientProfile.id}
          patientName={selectedPatientProfile.name}
        />
      )}
    </div>
  );
}
