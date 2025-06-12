import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Edit2, Save, X } from 'lucide-react';
import { API, getAuthHeaders } from '../utils/api';

export default function ProfileTab({ profile, onProfileUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile || {});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profile || {});
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await axios.put(
        `${API}/user/profile`,
        {
          name: form.name,
          mobile: form.mobile,
          bio: form.bio,
          designation: form.designation,
        },
        getAuthHeaders()
      );

      if (onProfileUpdated) {
        onProfileUpdated(response.data);
      }

      setEditing(false);
    } catch (err) {
      console.error('Profile update failed:', err);
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-white font-inter">
      <div className="bg-[#1a1a1a]/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] p-8 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center shadow-inner">
                {/* <User className="w-8 h-8 text-white" /> */}
                <User className="w-8 h-8 stroke-pink-500" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Profile Information</h2>
                <p className="text-gray-400">Manage your personal details</p>
              </div>
            </div>
            {editing ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-800 hover:bg-white/20 text-white rounded-lg transition-all duration-300 backdrop-blur-md hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={() => {
                    setForm(profile);
                    setEditing(false);
                    setError('');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-300 backdrop-blur-md hover:scale-105"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 backdrop-blur-md hover:scale-105"
              >
                <Edit2 className="w-4 h-4 stroke-purple-400" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { field: 'name', label: 'Full Name', type: 'text', editable: true },
              { field: 'email', label: 'Email Address', type: 'email', editable: false },
              { field: 'mobile', label: 'Mobile Number', type: 'tel', editable: true },
              { field: 'designation', label: 'Designation', type: 'text', editable: true },
            ].map(({ field, label, type, editable }) => (
              <div key={field} className="space-y-2">
                <label className="text-gray-300 font-medium">{label}</label>
                {editing && editable ? (
                  <input
                    type={type}
                    name={field}
                    value={form[field] || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white backdrop-blur-sm">
                    {form[field] || 'Not provided'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bio Field */}
          <div className="mt-6 space-y-2">
            <label className="text-gray-300 font-medium">Bio</label>
            {editing ? (
              <textarea
                name="bio"
                rows={4}
                value={form.bio || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all resize-none backdrop-blur-sm"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white min-h-[100px] backdrop-blur-sm">
                {form.bio || 'No bio provided'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
