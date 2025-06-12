import React, { useEffect, useState } from 'react';
import { User, Crown, Settings, Bell, LogOut } from 'lucide-react';
import axios from 'axios';

import { API, getAuthHeaders } from '../utils/api';
import OverviewTab from '../components/OverviewTab';
import ProfileTab from '../components/ProfileTab';
import SubscriptionTab from '../components/SubscriptionTab';
import ReportsTab from '../components/ReportTab';
import { navOptions } from '../utils/helpers';

export default function UserDashboard() {
  const [profile, setProfile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [plan, setPlan] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, getAuthHeaders());
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed', err);
      alert('Logout failed, please try again.');
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const profileRes = await axios.get(`${API}/user/profile`, getAuthHeaders());
        setProfile(profileRes.data);
        setResumeUrl(profileRes.data.resumeUrl || null);

        const featuresRes = await axios.get(`${API}/user/features`, getAuthHeaders());
        setPlan(featuresRes.data.plan);
        setFeatures(featuresRes.data.features);
      } catch (err) {
        console.error(err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleResumeChange = (newUrl) => setResumeUrl(newUrl);
  const handlePlanChange = (newPlan) => {
    setPlan(newPlan);
    window.location.reload();
  };
  const handleProfileUpdate = (updatedProfile) => setProfile(updatedProfile);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f0f] to-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-medium text-white">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f0f] to-[#1a1a1a] flex items-center justify-center">
        <div className="text-center bg-red-900/20 border border-red-500/30 rounded-xl p-8 backdrop-blur-sm">
          <p className="text-lg font-semibold text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f0f] to-[#1a1a1a] text-white">
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400">Welcome back, {profile?.name || 'User'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-white transition-transform hover:scale-105">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-transform hover:scale-105">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white transition-transform hover:scale-105"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Nav Tabs */}
        <nav className="mb-8">
          <div className="flex space-x-1 bg-white/5 backdrop-blur-md rounded-xl p-1 max-w-2xl mx-auto shadow-inner">
            {navOptions.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === id
                    ? 'bg-purple-600 text-white shadow-md scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Tabs */}
        {activeTab === 'overview' && (
          <OverviewTab
            profile={profile}
            plan={plan}
            features={features}
            resumeUrl={resumeUrl}
            onResumeChange={handleResumeChange}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileTab profile={profile} onProfileUpdated={handleProfileUpdate} />
        )}
        {activeTab === 'subscription' && (
          <SubscriptionTab currentPlan={plan} onPlanChange={handlePlanChange} />
        )}
        {activeTab === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
}
