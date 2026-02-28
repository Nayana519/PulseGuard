import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = mode === 'login' ? await login(form.email, form.password) : await register(form);
      navigate(user.role === 'caregiver' ? '/caregiver' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', width: '100%', borderRadius: 14,
    padding: '14px 18px', outline: 'none', fontSize: 14,
    transition: 'border 0.2s'
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#030712' }}>

      <style>{`
        @keyframes float-orb {
          0%,100% { transform:translate(0,0) scale(1); }
          33% { transform:translate(30px,-20px) scale(1.05); }
          66% { transform:translate(-20px,15px) scale(0.97); }
        }
        @keyframes auth-in {
          from { opacity:0; transform:translateY(20px) scale(0.98); }
          to { opacity:1; transform:translateY(0) scale(1); }
        }
        .auth-input:focus { border:1px solid rgba(139,92,246,0.5) !important; }
      `}</style>

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)', animation: 'float-orb 8s ease-in-out infinite', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(59,130,246,0.1),transparent 70%)', animation: 'float-orb 10s ease-in-out infinite reverse', filter: 'blur(40px)' }} />

      <div className="w-full max-w-md relative" style={{ animation: 'auth-in 0.5s cubic-bezier(0.34,1.3,0.64,1)' }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 relative"
            style={{
              background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.15))',
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 0 40px rgba(139,92,246,0.25)'
            }}>
            <span className="text-4xl">💊</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Medivia</h1>
          <p className="text-slate-500 mt-1.5 font-medium">Medication Safety Hub</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}>

          {/* Tab bar */}
          <div className="flex p-1.5 gap-1"
            style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all"
                style={mode === m ? {
                  background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(124,58,237,0.4)'
                } : { color: '#475569' }}>
                {m === 'login' ? '→ Sign In' : '✦ Register'}
              </button>
            ))}
          </div>

          <div className="p-7">
            <form onSubmit={handle} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input className="auth-input" style={inputStyle} placeholder="Jane Smith"
                      value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">I am a</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['patient','caregiver'].map(r => (
                        <button type="button" key={r} onClick={() => setForm({...form, role: r})}
                          className="py-4 rounded-2xl font-bold text-sm transition-all"
                          style={form.role === r ? {
                            background: 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(59,130,246,0.2))',
                            border: '1px solid rgba(139,92,246,0.5)', color: '#e2e8f0'
                          } : {
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)', color: '#475569'
                          }}>
                          <div className="text-2xl mb-1">{r === 'patient' ? '🤒' : '👨‍⚕️'}</div>
                          <div className="capitalize">{r}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                <input type="email" className="auth-input" style={inputStyle}
                  placeholder="you@example.com" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <input type="password" className="auth-input" style={inputStyle}
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} required />
              </div>

              {error && (
                <div className="rounded-2xl px-4 py-3 text-sm font-medium text-red-300"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  ⚠ {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-50"
                style={{
                  background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  boxShadow: loading ? 'none' : '0 8px 30px rgba(124,58,237,0.4)',
                  marginTop: 8
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Please wait…
                  </span>
                ) : mode === 'login' ? '→ Sign In' : '✦ Create Account'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Medication safety powered by NIH RxNav + openFDA
        </p>
      </div>
    </div>
  );
}