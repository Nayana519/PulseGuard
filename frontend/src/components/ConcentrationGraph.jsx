import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ConcentrationGraph({ medicationId, medicationName }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (medicationId) {
      api.get(`/doses/${medicationId}/concentration`).then(r => setData(r.data)).catch(() => {});
    } else {
      setData(null);
    }
  }, [medicationId]);

  if (!medicationId || !data) return (
    <div className="rounded-3xl p-8 flex flex-col items-center justify-center text-center"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', minHeight: 180 }}>
      <div className="text-3xl mb-2">📈</div>
      <p className="text-slate-500 text-sm font-medium">Click any medication card</p>
      <p className="text-slate-600 text-xs mt-0.5">to view its concentration curve</p>
    </div>
  );

  const chartData = {
    labels: data.accumulation.map(p => `${p.time}h`),
    datasets: [{
      label: 'Blood Concentration',
      data: data.accumulation.map(p => p.concentration),
      borderColor: '#8b5cf6',
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(139,92,246,0.25)');
        gradient.addColorStop(1, 'rgba(139,92,246,0.0)');
        return gradient;
      },
      fill: true, tension: 0.45, pointRadius: 0, borderWidth: 2.5,
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1b4b',
        borderColor: 'rgba(139,92,246,0.3)',
        borderWidth: 1,
        titleColor: '#a78bfa',
        bodyColor: '#e2e8f0',
        callbacks: { label: ctx => `Concentration: ${ctx.raw.toFixed(1)}%` }
      }
    },
    scales: {
      x: {
        ticks: { color: '#475569', maxTicksLimit: 8, font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.03)' }
      },
      y: {
        ticks: { color: '#475569', callback: v => v + '%', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.03)' },
        min: 0, max: 120
      }
    }
  };

  return (
    <div className="rounded-3xl p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg,rgba(139,92,246,0.06),rgba(59,130,246,0.04))',
        border: '1px solid rgba(139,92,246,0.15)'
      }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-violet-400 uppercase">Pharmacokinetics</div>
          <div className="text-white font-black text-sm mt-0.5">{medicationName} — Bloodstream Curve</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Half-life</div>
          <div className="text-violet-400 font-bold text-sm">{data.half_life}h</div>
        </div>
      </div>
      <Line data={chartData} options={options} />
      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-full bg-violet-500" />
          <span className="text-slate-500 text-xs">C(t) = C₀ × 0.5^(t/t½)</span>
        </div>
        {data.next_dose_time && (
          <div className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
            Next dose: {new Date(data.next_dose_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}