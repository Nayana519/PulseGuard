import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function ViewPatientProfileModal({
  isOpen,
  onClose,
  patientId,
  patientName,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && patientId) {
      loadProfile();
    }
  }, [isOpen, patientId]);

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/user/${patientId}/profile`);
      setProfile(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Patient profile not found");
      } else {
        setError("Failed to load patient profile");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-black/50 absolute inset-0" onClick={onClose} />
      <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-10 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {patientName}'s Profile
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-slate-400">
            Loading profile...
          </div>
        ) : profile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Age</div>
                <div className="text-white">{profile.age || "—"} years</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Height</div>
                <div className="text-white">
                  {profile.height_cm ? `${profile.height_cm} cm` : "—"}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Weight</div>
                <div className="text-white">
                  {profile.weight_kg ? `${profile.weight_kg} kg` : "—"}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Blood Type</div>
                <div className="text-white">{profile.blood_type || "—"}</div>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Allergies</div>
              <div className="text-white text-sm">
                {profile.allergies || "None listed"}
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Medical History</div>
              <div className="text-white text-sm">
                {profile.medical_history || "None listed"}
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">
                Previous Medications
              </div>
              <div className="text-white text-sm">
                {profile.medications_history || "None listed"}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">
                    Contact Name
                  </div>
                  <div className="text-white text-sm">
                    {profile.emergency_contact_name || "—"}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">
                    Phone Number
                  </div>
                  <div className="text-white text-sm">
                    {profile.emergency_contact_phone || "—"}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg mt-3">
                <div className="text-xs text-slate-400 mb-1">Relationship</div>
                <div className="text-white text-sm">
                  {profile.emergency_contact_relationship || "—"}
                </div>
              </div>
            </div>

            {profile.notes && (
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">
                  Additional Notes
                </div>
                <div className="text-white text-sm">{profile.notes}</div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
