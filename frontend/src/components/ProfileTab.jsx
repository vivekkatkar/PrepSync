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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-200">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-8 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                <p className="text-purple-200">Manage your personal details</p>
              </div>
            </div>
            {editing ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
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
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
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
                <label className="text-purple-200 font-medium">{label}</label>
                {editing && editable ? (
                  <input
                    type={type}
                    name={field}
                    value={form[field] || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white">
                    {form[field] || 'Not provided'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bio Field */}
          <div className="mt-6 space-y-2">
            <label className="text-purple-200 font-medium">Bio</label>
            {editing ? (
              <textarea
                name="bio"
                rows={4}
                value={form.bio || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white min-h-[100px]">
                {form.bio || 'No bio provided'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
