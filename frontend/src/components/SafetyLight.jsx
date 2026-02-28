import React from "react";

const CONFIG = {
  green: {
    label: "ALL CLEAR",
    desc: "All medications on track",
    glow: "rgba(34,197,94,0.5)",
    color: "#10b981",
    bg: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))",
    border: "rgba(34,197,94,0.4)",
    dotColor: "#10b981",
    textColor: "#065f46"
  },
  yellow: {
    label: "⚠️  ATTENTION NEEDED",
    desc: "Some items require review",
    glow: "rgba(245,158,11,0.5)",
    color: "#d97706",
    bg: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,179,8,0.08))",
    border: "rgba(245,158,11,0.4)",
    dotColor: "#f59e0b",
    textColor: "#78350f"
  },
  red: {
    label: "🚨 IMMEDIATE ALERT",
    desc: "Action required now",
    glow: "rgba(239,68,68,0.6)",
    color: "#dc2626",
    bg: "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.1))",
    border: "rgba(239,68,68,0.5)",
    dotColor: "#dc2626",
    textColor: "#7f1d1d"
  },
};

export default function SafetyLight({
  status,
  compliancePercent,
  alertCount,
  fatalInteractions = 0,
}) {
  const displayStatus = fatalInteractions > 0 ? "red" : status;
  const c = CONFIG[displayStatus] || CONFIG.green;

  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: `0 0 40px ${c.glow}`,
      }}
    >
      <style>{`
        @keyframes traffic-pulse {
          0%,100% { opacity:1; transform:scale(1); box-shadow:0 0 12px currentColor; }
          50% { opacity:0.75; transform:scale(0.94); box-shadow:0 0 24px currentColor; }
        }
        @keyframes ring-pulse {
          0% { transform:scale(1); opacity:0.6; }
          100% { transform:scale(2.2); opacity:0; }
        }
      `}</style>

      <div className="flex items-center gap-5">
        {/* Traffic light housing */}
        <div className="flex-shrink-0">
          <div
            className="w-12 rounded-2xl py-3 px-2.5 flex flex-col gap-2.5 items-center"
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {["red", "yellow", "green"].map((s) => (
              <div key={s} className="relative">
                <div
                  className="w-6 h-6 rounded-full transition-all duration-700"
                  style={{
                    background:
                      displayStatus === s
                        ? c.dotColor
                        : "rgba(255,255,255,0.06)",
                    boxShadow:
                      displayStatus === s
                        ? `0 0 16px ${c.dotColor}, 0 0 6px ${c.dotColor}`
                        : "none",
                    animation:
                      displayStatus === s
                        ? "traffic-pulse 2s ease-in-out infinite"
                        : "none",
                    color: c.dotColor,
                  }}
                />
                {displayStatus === s && (
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: c.dotColor,
                      animation: "ring-pulse 1.5s ease-out infinite",
                      opacity: 0.4,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status text */}
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-black tracking-[0.25em] uppercase mb-1"
            style={{ color: c.color }}
          >
            {c.label}
          </div>
          <div className="text-white font-black text-lg leading-tight">
            Safety Monitor
          </div>
          <div className="text-slate-400 text-xs mt-0.5">
            {fatalInteractions > 0
              ? `${fatalInteractions} fatal drug combo${fatalInteractions !== 1 ? "s" : ""} detected`
              : c.desc}
          </div>
        </div>

        {/* Compliance circle */}
        <div className="flex-shrink-0 text-center">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r="24"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="4"
              />
              <circle
                cx="30"
                cy="30"
                r="24"
                fill="none"
                stroke={c.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(compliancePercent / 100) * 150.8} 150.8`}
                style={{
                  filter: `drop-shadow(0 0 4px ${c.color})`,
                  transition: "stroke-dasharray 1s ease",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white font-black text-sm leading-none">
                {compliancePercent}%
              </span>
            </div>
          </div>
          <div className="text-slate-500 text-xs mt-1">compliance</div>
          {alertCount > 0 && (
            <div
              className="mt-1 text-xs font-bold px-2 py-0.5 rounded-full inline-block"
              style={{
                background: "rgba(239,68,68,0.2)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              {alertCount} alert{alertCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
