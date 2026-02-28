import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function EmergencyQR({ user, medications }) {
  const [show, setShow] = useState(false);

  const emergencyData = JSON.stringify({
    patient: user?.name,
    medications: medications?.map(m => ({
      name: m.name,
      dose: `${m.dose_amount} ${m.dose_unit}`,
      frequency: `Every ${m.frequency_hours}h`,
      warnings: m.boxed_warnings ? 'YES' : 'None'
    })),
    generated: new Date().toISOString(),
    note: 'EMERGENCY USE — Show to paramedics'
  });

  return (
    <div>
      <button onClick={() => setShow(true)}
        className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 font-semibold px-4 py-2 rounded-xl transition-all text-sm">
        🆘 Emergency QR
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShow(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="text-red-600 font-bold text-xl mb-1">🆘 EMERGENCY MEDICAL</div>
            <div className="text-gray-600 text-sm mb-4">Show this to paramedics or ER staff</div>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={emergencyData} size={200} level="H" fgColor="#1e293b" />
            </div>
            <div className="text-left bg-gray-50 rounded-xl p-4 text-xs space-y-1">
              <div className="font-bold text-gray-700">Patient: {user?.name}</div>
              {medications?.slice(0, 3).map(m => (
                <div key={m.id} className="text-gray-600">
                  • {m.name} — {m.dose_amount}{m.dose_unit} every {m.frequency_hours}h
                  {m.boxed_warnings && <span className="text-red-600 font-bold"> ⚠️ Boxed Warning</span>}
                </div>
              ))}
              {medications?.length > 3 && <div className="text-gray-500">+{medications.length - 3} more...</div>}
            </div>
            <button onClick={() => setShow(false)}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-xl text-sm">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}