import React, { useEffect, useState } from 'react';
// import axios from 'axios';
import axios from "../config/config.js"
// import { BACKEND_URL } from '../config/backendConfig.js';
import { API } from '../utils/api.js';

export default function CreateInterview() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [featureInfo, setFeatureInfo] = useState(null);

  const fetchInterviews = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get('/interviews/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInterviews(res.data);
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError('Failed to fetch interviews');
    } finally {
      setLoading(false);
    }
  };

  const createInterview = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        '/interviews/create',
        { type: 'peer' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeatureInfo(res.data.allowed
        ? {
            planType: res.data.planType,
            level: res.data.allowed.level,
            quota: res.data.allowed.quota,
            used: res.data.allowed.used,
          }
        : null
      );

      await fetchInterviews();

      alert(`Interview room created! Room ID: ${res.data.roomId}`);
    } catch (err) {
      console.error('Error creating interview:', err);
      const message = err.response?.data?.message;

      console.log(message);
      if (message === 'No one is currently available for an interview. Please try again later.') {
        alert('No other users are online right now. Please try again later.');
      } else {
        setError(message || 'Failed to create interview');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyRoomLink = (meetLink) => {
    navigator.clipboard.writeText(meetLink)
      .then(() => alert('Room link copied!'))
      .catch(() => alert('Failed to copy link'));
  };

  const joinInterview = (roomId) => {
    window.open(`/interview/${roomId}`, '_blank');
  };

  const deleteInterview = async (interviewId) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/interviews/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchInterviews();
      alert('Interview deleted successfully');
    } catch (err) {
      console.error('Error deleting interview:', err);
      alert('Failed to delete interview');
    }
  };

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    fetchInterviews();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🎥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">One-on-One Video Interviews</h1>
              <p className="text-purple-200">Create interview rooms and share the link with candidates or interviewers.</p>
            </div>
          </div>

          <button
            onClick={createInterview}
            disabled={loading}
            className={`
              relative overflow-hidden px-8 py-4 rounded-lg font-semibold text-white text-lg
              transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
              ${loading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <span className="text-xl">➕</span>
                  Create Interview Room
                </>
              )}
            </div>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="backdrop-blur-lg bg-red-500/20 border border-red-400/30 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <p className="text-red-200 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Feature Info */}
        {featureInfo && (
          <div className="backdrop-blur-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
                <p className="text-green-200 text-sm">Plan</p>
                <p className="text-white font-semibold">{featureInfo.planType}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-bold">🎯</span>
                </div>
                <p className="text-blue-200 text-sm">Access Level</p>
                <p className="text-white font-semibold">{featureInfo.level}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
                <p className="text-yellow-200 text-sm">Used</p>
                <p className="text-white font-semibold">{featureInfo.used}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-bold">💎</span>
                </div>
                <p className="text-purple-200 text-sm">Quota</p>
                <p className="text-white font-semibold">{featureInfo.quota === null ? 'Unlimited' : featureInfo.quota}</p>
              </div>
            </div>
          </div>
        )}

        {/* Interviews Section Header */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📋</span>
            </div>
            Your Interviews
          </h2>
        </div>

        {/* Interviews Grid */}
        {loading && interviews.length === 0 ? (
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-12 text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-200 text-lg">Loading interviews...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl">📭</span>
            </div>
            <p className="text-purple-200 text-lg">No interview rooms found</p>
            <p className="text-purple-300 text-sm mt-2">Create your first interview room to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {interviews.map((interview) => (
              <div key={interview.id} className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-102 hover:shadow-2xl">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">🎥</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Interview Room</h3>
                      <p className="text-purple-200 text-sm">{interview.type}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    interview.user.id === currentUserId 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-200 border border-green-400/30' 
                      : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border border-blue-400/30'
                  }`}>
                    {interview.user.id === currentUserId ? 'Host' : 'Participant'}
                  </div>
                </div>

                {/* Card Content */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs">🆔</span>
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm">Room ID</p>
                      <code className="text-white bg-black/30 px-2 py-1 rounded font-mono text-sm">{interview.roomId}</code>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs">📅</span>
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm">Created</p>
                      <p className="text-white font-medium">{new Date(interview.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs">👤</span>
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm">Created By</p>
                      <p className="text-white font-medium">{interview.user?.name || 'N/A'}</p>
                    </div>
                  </div>

                  {interview.scheduledWith && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs">🤝</span>
                      </div>
                      <div>
                        <p className="text-purple-200 text-sm">Scheduled With</p>
                        <p className="text-white font-medium">{interview.scheduledWith?.name || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {interview.recordingUrl && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs">🎬</span>
                      </div>
                      <div>
                        <p className="text-purple-200 text-sm">Recording</p>
                        <a 
                          href={`${API}${interview.recordingUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 transition-colors underline font-medium"
                        >
                          View Recording
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="backdrop-blur-lg bg-black/20 border border-white/10 rounded-lg p-4">
                    <p className="text-purple-200 text-sm mb-2">Meet Link</p>
                    <code className="text-white bg-black/30 px-3 py-2 rounded block font-mono text-xs break-all">
                      {interview.meetLink}
                    </code>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => joinInterview(interview.roomId)}
                    className="flex-1 min-w-0 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>🎥</span>
                    Join
                  </button>
                  <button 
                    onClick={() => copyRoomLink(interview.meetLink)}
                    className="flex-1 min-w-0 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>📋</span>
                    Copy Link
                  </button>
                  {interview.user.id === currentUserId && (
                    <button 
                      onClick={() => deleteInterview(interview.id)}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>🗑️</span>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}