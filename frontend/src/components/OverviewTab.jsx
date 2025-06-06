import React from 'react';
import { User, FileText, Crown, CheckCircle, Star, Zap, Shield } from 'lucide-react';
import ResumeUploader from './ResumeUploader';
import FeatureList from './FeatureList';

export default function OverviewTab({ profile, plan, features, resumeUrl, onResumeChange }) {
  const getPlanColor = (planName) => {
    switch (planName) {
      case 'FREE': return 'from-gray-500 to-gray-600';
      case 'PRO': return 'from-purple-500 to-pink-500';
      case 'ENTERPRISE': return 'from-yellow-500 to-orange-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'FREE': return Star;
      case 'PRO': return Zap;
      case 'ENTERPRISE': return Shield;
      default: return Star;
    }
  };

  const PlanIcon = getPlanIcon(plan);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">Current Plan</p>
              <p className="text-2xl font-bold text-white">{plan || 'N/A'}</p>
            </div>
            <div className={`w-12 h-12 bg-gradient-to-r ${getPlanColor(plan)} rounded-xl flex items-center justify-center`}>
              <PlanIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">Features</p>
              <p className="text-2xl font-bold text-white">{features.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">Resume Status</p>
              <p className="text-2xl font-bold text-white">{resumeUrl ? 'Uploaded' : 'None'}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">Profile</p>
              <p className="text-2xl font-bold text-white">Complete</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Summary */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">Profile Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-purple-200 text-sm font-medium">Full Name</label>
                <p className="text-white text-lg">{profile?.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-purple-200 text-sm font-medium">Email</label>
                <p className="text-white text-lg">{profile?.email || 'Not provided'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-purple-200 text-sm font-medium">Mobile</label>
                <p className="text-white text-lg">{profile?.mobile || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-purple-200 text-sm font-medium">Designation</label>
                <p className="text-white text-lg">{profile?.designation || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <ResumeUploader resumeUrl={resumeUrl} onResumeChange={onResumeChange} />
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-6">Available Features</h3>
        <FeatureList features={features} />
      </div>
    </div>
  );
}