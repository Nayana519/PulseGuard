import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function ViewPatientProfileModal({
  isOpen,
  onClose,
  patientId,
  patientName,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !patientId) return;
    setLoading(true);
    setError("");
    api
      .get(`/caregiver/patient-profile/${patientId}`)
      .then((r) => setProfile(r.data))
      .catch(() => setError("Failed to load patient profile."))
      .finally(() => setLoading(false));
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{
          background: "white",
          border: "2px solid #e5e7eb",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 px-6 py-5 flex items-center justify-between rounded-t-3xl"
          style={{
            background: "linear-gradient(135deg, #1e3a8a, #1f2937)",
            borderBottom: "3px solid #3b82f6",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black text-white"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              {patientName?.[0]}
            </div>
            <div>
              <div className="text-white font-black text-lg">{patientName}</div>
              <div className="text-blue-200 text-xs">Patient Profile</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg transition-all hover:bg-white hover:bg-opacity-20"
          >
            x
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-12 text-gray-500 font-semibold">
              Loading profile...
            </div>
          )}

          {error && (
            <div
              className="rounded-2xl p-4 text-red-700 font-semibold text-sm"
              style={{ background: "#fef2f2", border: "1px solid #dc2626" }}
            >
              {error}
            </div>
          )}

          {profile && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    icon: "💊",
                    value: profile.medications.length,
                    label: "Medications",
                    color: "#3b82f6",
                    bg: "#eff6ff",
                  },
                  {
                    icon: "📋",
                    value: `${profile.compliance_percent}%`,
                    label: "Compliance",
                    color: "#10b981",
                    bg: "#f0fdf4",
                  },
                  {
                    icon: "🔔",
                    value: profile.active_alerts.length,
                    label: "Active Alerts",
                    color: "#dc2626",
                    bg: "#fef2f2",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl p-4 text-center"
                    style={{
                      background: s.bg,
                      border: `1px solid ${s.color}33`,
                    }}
                  >
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div
                      className="text-2xl font-black"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div className="text-gray-600 text-xs font-semibold mt-0.5">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Medications */}
              <div>
                <h3 className="text-gray-900 font-black text-base mb-3">
                  💊 Medications
                </h3>
                {profile.medications.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No medications on record.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {profile.medications.map((med) => {
                      const isLow = med.current_stock <= med.stock_threshold;
                      const isOverdue =
                        med.next_dose_time &&
                        new Date(med.next_dose_time) < new Date();
                      return (
                        <div
                          key={med.id}
                          className="rounded-2xl p-4"
                          style={{
                            background: isOverdue
                              ? "#fef2f2"
                              : isLow
                              ? "#fffbeb"
                              : "#f9fafb",
                            border: `2px solid ${
                              isOverdue
                                ? "#dc2626"
                                : isLow
                                ? "#f59e0b"
                                : "#e5e7eb"
                            }`,
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="text-gray-900 font-black text-sm">
                                {med.name}
                              </span>
                              <span
                                className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                                style={{
                                  background: "#e0e7ff",
                                  color: "#4338ca",
                                }}
                              >
                                {med.form}
                              </span>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              {isOverdue && (
                                <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-lg">
                                  Overdue
                                </span>
                              )}
                              {isLow && (
                                <span className="text-xs font-bold text-white bg-amber-500 px-2 py-0.5 rounded-lg">
                                  Low Stock
                                </span>
                              )}
                              {med.boxed_warnings && (
                                <span className="text-xs font-bold text-white bg-red-800 px-2 py-0.5 rounded-lg">
                                  Box Warn
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {[
                              {
                                label: "Dose",
                                value: `${med.dose_amount} ${med.dose_unit}`,
                              },
                              {
                                label: "Every",
                                value: `${med.frequency_hours}h`,
                              },
                              {
                                label: "Stock",
                                value: `${med.current_stock} ${med.dose_unit}`,
                              },
                              {
                                label: "Next Dose",
                                value: med.next_dose_time
                                  ? new Date(
                                      med.next_dose_time
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "N/A",
                              },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="rounded-lg p-2 text-center"
                                style={{
                                  background: "rgba(255,255,255,0.8)",
                                }}
                              >
                                <div className="text-gray-500 font-semibold">
                                  {item.label}
                                </div>
                                <div className="text-gray-900 font-black mt-0.5">
                                  {item.value}
                                </div>
                              </div>
                            ))}
                          </div>

                          {med.boxed_warnings && (
                            <div
                              className="mt-2 rounded-lg p-2 text-xs text-red-700 font-semibold leading-relaxed"
                              style={{
                                background: "#fef2f2",
                                border: "1px solid #fca5a5",
                              }}
                            >
                              {med.boxed_warnings.slice(0, 200)}
                              {med.boxed_warnings.length > 200 ? "..." : ""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Dose History */}
              <div>
                <h3 className="text-gray-900 font-black text-base mb-3">
                  📋 Recent Dose History
                </h3>
                {profile.dose_history.length === 0 ? (
                  <p className="text-gray-500 text-sm">No dose history yet.</p>
                ) : (
                  <div className="space-y-2">
                    {profile.dose_history.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{
                          background:
                            log.status === "taken"
                              ? "#f0fdf4"
                              : log.status === "missed"
                              ? "#fef2f2"
                              : "#f9fafb",
                          border: `1px solid ${
                            log.status === "taken"
                              ? "#10b981"
                              : log.status === "missed"
                              ? "#dc2626"
                              : "#e5e7eb"
                          }`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {log.status === "taken"
                              ? "✅"
                              : log.status === "missed"
                              ? "❌"
                              : "⏭️"}
                          </span>
                          <div>
                            <div className="text-gray-900 font-bold text-sm">
                              {log.medication_name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {new Date(log.scheduled_time).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                        <span
                          className="text-xs font-black px-3 py-1 rounded-full capitalize"
                          style={{
                            background:
                              log.status === "taken"
                                ? "#d1fae5"
                                : log.status === "missed"
                                ? "#fee2e2"
                                : "#f3f4f6",
                            color:
                              log.status === "taken"
                                ? "#047857"
                                : log.status === "missed"
                                ? "#991b1b"
                                : "#6b7280",
                          }}
                        >
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Alerts */}
              {profile.active_alerts.length > 0 && (
                <div>
                  <h3 className="text-gray-900 font-black text-base mb-3">
                    🔔 Active Alerts
                  </h3>
                  <div className="space-y-2">
                    {profile.active_alerts.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-xl px-4 py-3"
                        style={{
                          background:
                            a.severity === "critical" ? "#fef2f2" : "#fffbeb",
                          borderLeft: `4px solid ${
                            a.severity === "critical" ? "#dc2626" : "#f59e0b"
                          }`,
                        }}
                      >
                        <div className="text-gray-900 font-bold text-sm">
                          {a.severity === "critical" ? "🚨" : "⚠️"} {a.title}
                        </div>
                        <div className="text-gray-600 text-xs mt-0.5">
                          {a.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}