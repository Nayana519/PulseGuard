import React, { useEffect, useRef } from 'react';

export default function InteractionAlarm({ warning, onDismiss }) {
  const audioRef = useRef(null);

  useEffect(() => {
    // Generate alarm sound using Web Audio API
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let stopped = false;

    const beep = (freq, start, duration) => {
      if (stopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    };

    // Play alarm pattern: 3 sharp beeps
    beep(880, 0, 0.15);
    beep(880, 0.2, 0.15);
    beep(880, 0.4, 0.15);
    beep(1100, 0.7, 0.4);

    // Also trigger browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 FATAL DRUG INTERACTION DETECTED', {
        body: warning?.message || 'A dangerous drug combination was blocked.',
        requireInteraction: true,
        tag: 'drug-interaction'
      });
    }

    return () => { stopped = true; ctx.close(); };
  }, [warning]);

  if (!warning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}>

      {/* Pulsing red border overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 80px rgba(239,68,68,0.4)',
          animation: 'pulse-border 1s ease-in-out infinite'
        }} />

      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: inset 0 0 80px rgba(239,68,68,0.3); }
          50% { box-shadow: inset 0 0 120px rgba(239,68,68,0.7); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="relative w-full max-w-lg"
        style={{ animation: 'slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Alarm card */}
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a0505 0%, #2d0a0a 50%, #1a0505 100%)',
            border: '2px solid rgba(239,68,68,0.6)',
            boxShadow: '0 0 60px rgba(239,68,68,0.4), 0 0 120px rgba(239,68,68,0.15)'
          }}>

          {/* Top danger strip */}
          <div className="h-2 w-full"
            style={{
              background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #7f1d1d 10px, #7f1d1d 20px)',
              animation: 'pulse-border 0.8s ease-in-out infinite'
            }} />

          <div className="p-8">
            {/* Icon + Title */}
            <div className="flex items-start gap-5 mb-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '2px solid rgba(239,68,68,0.4)',
                  animation: 'shake 0.6s ease-in-out 0.5s 2'
                }}>
                ☠️
              </div>
              <div>
                <div className="text-xs font-black tracking-[0.3em] text-red-500 mb-1 uppercase">
                  ⚠ Entry Blocked by PulseGuard Shield
                </div>
                <h2 className="text-2xl font-black text-white leading-tight">
                  Fatal Drug Interaction<br />
                  <span className="text-red-400">Detected</span>
                </h2>
              </div>
            </div>

            {/* Message */}
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-red-200 text-sm leading-relaxed">{warning.message}</p>
            </div>

            {/* Interaction details */}
            <div className="space-y-3 mb-6">
              {warning.interactions?.map((ix, i) => (
                <div key={i} className="rounded-xl p-4"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500 font-black text-xs tracking-widest uppercase">
                      {ix.severity || 'High'} Risk
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.2)' }} />
                    {ix.source && (
                      <span className="text-red-800 text-xs">{ix.source}</span>
                    )}
                  </div>
                  {ix.drugs?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {ix.drugs.map((d, j) => (
                        <span key={j} className="text-xs font-bold px-2 py-1 rounded-lg text-red-300"
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                          💊 {d}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-slate-300 text-xs leading-relaxed">{ix.description}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={onDismiss}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#fca5a5'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.25)'}
                onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.15)'}>
                ← Go Back (Safe Choice)
              </button>
              <button
                onClick={() => {
                  if (window.confirm('⚠️ WARNING: This combination may be FATAL. Are you absolutely sure you want to override the safety block? This action will be logged.')) {
                    onDismiss('override');
                  }
                }}
                className="px-4 py-3 rounded-xl font-bold text-xs transition-all text-slate-500 hover:text-slate-400"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                Override
              </button>
            </div>
          </div>

          {/* Bottom danger strip */}
          <div className="h-2 w-full"
            style={{
              background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #7f1d1d 10px, #7f1d1d 20px)',
              animation: 'pulse-border 0.8s ease-in-out infinite'
            }} />
        </div>
      </div>
    </div>
  );
}