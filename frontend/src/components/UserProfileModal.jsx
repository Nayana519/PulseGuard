import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function UserProfileModal({ isOpen, onClose, user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/profile");
      setProfile(response.data);
      setFormData(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null);
        setFormData({});
      } else {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : isNaN(value) ? value : parseFloat(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let response;
      if (profile) {
        response = await api.put("/profile", formData);
      } else {
        response = await api.post("/profile", formData);
      }
      setProfile(response.data);
      setIsEditing(false);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
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
          <h2 className="text-2xl font-bold text-white">User Profile</h2>
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

        {loading && !profile ? (
          <div className="text-center py-8 text-slate-400">
            Loading profile...
          </div>
        ) : profile && !isEditing ? (
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

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">
                  Emergency Contact Name
                </div>
                <div className="text-white text-sm">
                  {profile.emergency_contact_name || "—"}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">
                  Emergency Contact Phone
                </div>
                <div className="text-white text-sm">
                  {profile.emergency_contact_phone || "—"}
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">
                Emergency Contact Relationship
              </div>
              <div className="text-white text-sm">
                {profile.emergency_contact_relationship || "—"}
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">
                Additional Notes
              </div>
              <div className="text-white text-sm">
                {profile.notes || "None"}
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 65"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="height_cm"
                  value={formData.height_cm || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 175"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="weight_kg"
                  value={formData.weight_kg || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 75"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Blood Type
                </label>
                <select
                  name="blood_type"
                  value={formData.blood_type || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select blood type</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Allergies
              </label>
              <textarea
                name="allergies"
                value={formData.allergies || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 h-20"
                placeholder="List any known allergies..."
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Medical History
              </label>
              <textarea
                name="medical_history"
                value={formData.medical_history || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 h-20"
                placeholder="e.g., Hypertension, Diabetes, Previous surgeries..."
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Previous Medications
              </label>
              <textarea
                name="medications_history"
                value={formData.medications_history || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 h-20"
                placeholder="List medications used previously..."
              />
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-white mb-4">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="+1-234-567-8900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 mt-4">
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Spouse, Child, Parent..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 h-16"
                placeholder="Any other relevant information..."
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(profile || {});
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
