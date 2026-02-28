import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import InteractionAlarm from "./InteractionAlarm";

const FORM_OPTIONS = [
  { value: "pill", label: "Pill", icon: "💊", unit: "mg", threshold: 5 },
  { value: "liquid", label: "Liquid", icon: "🧴", unit: "ml", threshold: 20 },
  {
    value: "injection",
    label: "Injection",
    icon: "💉",
    unit: "units",
    threshold: 10,
  },
];

export default function AddMedicationModal({ onClose, onAdded, patientId }) {
  const [form, setForm] = useState({
    name: "",
    form: "pill",
    dose_amount: "",
    dose_unit: "mg",
    frequency_hours: "8",
    half_life_hours: "6",
    current_stock: "",
    stock_threshold: "5",
  });
  const [fdaInfo, setFdaInfo] = useState(null);
  const [fdaLoading, setFdaLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [interactionWarning, setInteractionWarning] = useState(null);
  const [interactionCheck, setInteractionCheck] = useState(null);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);

  const lookupFDA = useCallback(async () => {
    if (form.name.length < 3) {
      setFdaInfo(null);
      setInteractionCheck(null);
      setAcknowledgedWarning(false);
      return;
    }
    setFdaLoading(true);
    setInteractionLoading(true);
    try {
      const r = await api.get(
        `/medications/fda-info?name=${encodeURIComponent(form.name)}`,
      );
      setFdaInfo(r.data);

      // Check for interactions with current medications
      if (r.data?.rxcui || form.name) {
        try {
          const intRes = await api.post("/medications/check-interactions", {
            name: form.name,
            patient_id: patientId,
            half_life_hours: parseFloat(form.half_life_hours) || 6,
          });
          setInteractionCheck(intRes.data);
          setAcknowledgedWarning(false);
        } catch (err) {
          console.error("Interaction check failed:", err);
          setInteractionCheck(null);
        }
      }
    } catch (_) {
      setFdaInfo(null);
      setInteractionCheck(null);
    } finally {
      setFdaLoading(false);
      setInteractionLoading(false);
    }
  }, [form.name, patientId, form.half_life_hours]);

  useEffect(() => {
    const t = setTimeout(lookupFDA, 700);
    return () => clearTimeout(t);
  }, [lookupFDA]);

  const handleFormType = (val) => {
    const opt = FORM_OPTIONS.find((o) => o.value === val);
    setForm((f) => ({
      ...f,
      form: val,
      dose_unit: opt.unit,
      stock_threshold: String(opt.threshold),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    // Check for critical interactions
    if (interactionCheck?.has_critical && !acknowledgedWarning) {
      setError("");
      return; // The warning display will show below
    }

    setError("");
    setLoading(true);
    try {
      const r = await api.post("/medications/", {
        ...form,
        patient_id: patientId,
        acknowledged_warning: acknowledgedWarning,
      });
      onAdded(r.data);
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === "FATAL_INTERACTION_BLOCKED") {
        setInteractionWarning(data);
      } else {
        setError(data?.error || "Failed to add medication");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };
  const inputFocus = (e) =>
    (e.target.style.border = "1px solid rgba(139,92,246,0.5)");
  const inputBlur = (e) =>
    (e.target.style.border = "1px solid rgba(255,255,255,0.08)");

  return (
    <>
      {interactionWarning && (
        <InteractionAlarm
          warning={interactionWarning}
          onDismiss={(action) => {
            setInteractionWarning(null);
            if (action === "override") {
              api
                .post("/medications/", {
                  ...form,
                  patient_id: patientId,
                  override_interaction: true,
                })
                .then((r) => {
                  onAdded(r.data);
                  onClose();
                })
                .catch((err) =>
                  setError(err.response?.data?.error || "Error saving"),
                );
            }
          }}
        />
      )}

      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
      >
        <style>{`
          @keyframes modal-up {
            from { opacity:0; transform:translateY(24px) scale(0.98); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
          .modal-card { animation: modal-up 0.32s cubic-bezier(0.34,1.3,0.64,1); }
        `}</style>

        <div
          className="modal-card w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
          style={{
            background:
              "linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 -30px 80px rgba(139,92,246,0.2)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 pt-6 pb-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-violet-400 uppercase">
                New Medication
              </p>
              <h2 className="text-xl font-black text-white mt-0.5">
                Add to My Shield
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={submit} className="px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Medication Name
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-2xl px-5 py-4 text-white font-semibold placeholder-slate-600 focus:outline-none transition-all"
                  style={inputStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  placeholder="e.g. Warfarin, Aspirin, Metformin…"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                {fdaLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                    <span className="text-violet-400 text-xs">Scanning…</span>
                  </div>
                )}
                {fdaInfo?.rxcui && !fdaLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-green-400 text-xs font-bold">
                      FDA Matched
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* FDA Info */}
            {fdaInfo && (
              <div className="space-y-2">
                {fdaInfo.boxed_warnings &&
                  fdaInfo.boxed_warnings.length > 0 && (
                    <div
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                      }}
                    >
                      <p className="text-xs font-black tracking-widest text-red-400 uppercase mb-1.5">
                        ⚠️ FDA Boxed Warning
                      </p>
                      <p className="text-red-200 text-xs leading-relaxed">
                        {fdaInfo.boxed_warnings}
                      </p>
                    </div>
                  )}
                {fdaInfo.description && fdaInfo.description.length > 0 && (
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: "rgba(59,130,246,0.08)",
                      border: "1px solid rgba(59,130,246,0.2)",
                    }}
                  >
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5">
                      📋 Drug Information
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {fdaInfo.description}
                    </p>
                  </div>
                )}
                {fdaInfo.side_effects && fdaInfo.side_effects.length > 0 && (
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                      ⚡ Adverse Reactions
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {fdaInfo.side_effects}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Interaction Check */}
            {interactionLoading && (
              <div
                className="rounded-2xl p-4 flex items-center gap-2"
                style={{
                  background: "rgba(100,116,139,0.1)",
                  border: "1px solid rgba(100,116,139,0.2)",
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                <span className="text-slate-400 text-xs">
                  Checking drug interactions…
                </span>
              </div>
            )}

            {interactionCheck &&
              (interactionCheck.critical_interactions?.length > 0 ||
                interactionCheck.warnings?.length > 0) && (
                <div className="space-y-2">
                  {interactionCheck.critical_interactions?.length > 0 && (
                    <div
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        border: "2px solid rgba(239,68,68,0.5)",
                      }}
                    >
                      <p className="text-xs font-black tracking-widest text-red-400 uppercase mb-2">
                        🚨 CRITICAL INTERACTION
                      </p>
                      {interactionCheck.critical_interactions.map(
                        (interaction, idx) => (
                          <div key={idx} className="text-red-200 text-xs mb-2">
                            <p className="font-bold">
                              {interaction.drugs?.join(" + ")}
                            </p>
                            <p className="text-red-300">
                              {interaction.description}
                            </p>
                            <p className="text-xs text-red-400 mt-1">
                              Severity:{" "}
                              {interaction.severity
                                ? interaction.severity.toUpperCase()
                                : "HIGH"}
                            </p>
                          </div>
                        ),
                      )}
                      {!acknowledgedWarning && (
                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={acknowledgedWarning}
                            onChange={(e) =>
                              setAcknowledgedWarning(e.target.checked)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-xs text-red-300">
                            I understand the danger and accept responsibility
                          </span>
                        </label>
                      )}
                    </div>
                  )}

                  {interactionCheck.warnings?.length > 0 &&
                    interactionCheck.critical_interactions?.length === 0 && (
                      <div
                        className="rounded-2xl p-4"
                        style={{
                          background: "rgba(245,158,11,0.1)",
                          border: "1px solid rgba(245,158,11,0.3)",
                        }}
                      >
                        <p className="text-xs font-black tracking-widest text-amber-400 uppercase mb-2">
                          ⚠️ Drug Interaction Warning
                        </p>
                        {interactionCheck.warnings
                          .slice(0, 2)
                          .map((warning, idx) => (
                            <div
                              key={idx}
                              className="text-amber-200 text-xs mb-2"
                            >
                              <p className="font-bold">
                                {warning.drugs?.join(" + ")}
                              </p>
                              <p className="text-amber-300">
                                {warning.description}
                              </p>
                            </div>
                          ))}
                        <p className="text-xs text-amber-400 mt-2">
                          ⚡ Monitor for increased side effects and report
                          unusual symptoms.
                        </p>
                      </div>
                    )}
                </div>
              )}

            {/* Form type */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Form
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FORM_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => handleFormType(opt.value)}
                    className="py-3.5 rounded-2xl text-sm font-bold transition-all"
                    style={
                      form.form === opt.value
                        ? {
                            background:
                              "linear-gradient(135deg,rgba(139,92,246,0.3),rgba(59,130,246,0.3))",
                            border: "1px solid rgba(139,92,246,0.5)",
                            color: "#e2e8f0",
                          }
                        : {
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "#64748b",
                          }
                    }
                  >
                    <div className="text-xl mb-1">{opt.icon}</div>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dose + frequency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Dose
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="flex-1 rounded-xl px-3 py-3 text-white focus:outline-none text-sm"
                    style={inputStyle}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                    placeholder="10"
                    value={form.dose_amount}
                    onChange={(e) =>
                      setForm({ ...form, dose_amount: e.target.value })
                    }
                    required
                  />
                  <div
                    className="rounded-xl px-3 py-3 text-slate-400 text-sm font-bold"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {form.dose_unit}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Every (hrs)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="w-full rounded-xl px-3 py-3 text-white focus:outline-none text-sm"
                  style={inputStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  placeholder="8"
                  value={form.frequency_hours}
                  onChange={(e) =>
                    setForm({ ...form, frequency_hours: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Half-life (hrs)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="w-full rounded-xl px-3 py-3 text-white focus:outline-none text-sm"
                  style={inputStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  placeholder="6"
                  value={form.half_life_hours}
                  onChange={(e) =>
                    setForm({ ...form, half_life_hours: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="w-full rounded-xl px-3 py-3 text-white focus:outline-none text-sm"
                  style={inputStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  placeholder="30"
                  value={form.current_stock}
                  onChange={(e) =>
                    setForm({ ...form, current_stock: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                className="w-full rounded-xl px-4 py-3 text-white focus:outline-none text-sm"
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
                value={form.stock_threshold}
                onChange={(e) =>
                  setForm({ ...form, stock_threshold: e.target.value })
                }
              />
            </div>

            {error && (
              <div
                className="rounded-2xl px-4 py-3 text-red-300 text-sm"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                ⚠ {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl text-slate-400 font-bold text-sm hover:text-white transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  (interactionCheck?.has_critical && !acknowledgedWarning)
                }
                className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-40"
                style={{
                  background:
                    interactionCheck?.has_critical && !acknowledgedWarning
                      ? "linear-gradient(135deg,#7c3aed66,#2563eb66)"
                      : "linear-gradient(135deg,#7c3aed,#2563eb)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Scanning Interactions…
                  </span>
                ) : interactionCheck?.has_critical && !acknowledgedWarning ? (
                  "⛔ Acknowledge Warning First"
                ) : (
                  "🛡 Add to Shield"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
