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
    <div className="min-h-screen pt-30 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <span className="text-white text-xl">🎥</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                One-on-One Video Interviews
              </h1>
              <p className="text-gray-300">Create interview rooms and share the link with candidates or interviewers.</p>
            </div>
          </div>

          <button
            onClick={createInterview}
            disabled={loading}
            className={`
              px-8 py-3 rounded-xl font-semibold text-white
              transition-all duration-300 hover:scale-105 shadow-2xl
              ${loading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
          <div className="bg-red-500/20 backdrop-blur-lg border border-red-400/30 rounded-2xl p-6 mb-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50"></div>
              <p className="text-white font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Feature Info */}
        {featureInfo && (
          <div className="bg-emerald-500/20 backdrop-blur-lg border border-emerald-400/30 rounded-2xl p-8 mb-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center group">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">📋</span>
                </div>
                <p className="text-emerald-300 text-sm">Plan</p>
                <p className="text-white font-semibold">{featureInfo.planType}</p>
              </div>
              <div className="text-center group">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <p className="text-cyan-300 text-sm">Access Level</p>
                <p className="text-white font-semibold">{featureInfo.level}</p>
              </div>
              <div className="text-center group">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">📊</span>
                </div>
                <p className="text-amber-300 text-sm">Used</p>
                <p className="text-white font-semibold">{featureInfo.used}</p>
              </div>
              <div className="text-center group">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">💎</span>
                </div>
                <p className="text-purple-300 text-sm">Quota</p>
                <p className="text-white font-semibold">{featureInfo.quota === null ? 'Unlimited' : featureInfo.quota}</p>
              </div>
            </div>
          </div>
        )}

        {/* Interviews Section Header */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
              <span className="text-white text-sm">📋</span>
            </div>
            Your Interviews
          </h2>
        </div>

        {/* Interviews Grid */}
        {loading && interviews.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-12 text-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Loading interviews...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-12 text-center shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl">📭</span>
            </div>
            <p className="text-gray-300 text-lg">No interview rooms found</p>
            <p className="text-gray-400 text-sm mt-2">Create your first interview room to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {interviews.map((interview) => (
              <div key={interview.id} className="bg-white/8 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/12 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 group">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Interview Room</h3>
                      <p className="text-gray-400 text-sm capitalize">{interview.type}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    interview.user.id === currentUserId 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {interview.user.id === currentUserId ? 'HOST' : 'PARTICIPANT'}
                  </div>
                </div>

                {/* Card Content */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-sm font-medium">Room ID</p>
                      <code className="text-white bg-gray-800/50 px-2 py-1 rounded-md font-mono text-sm">{interview.roomId}</code>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v1h6V7m-6 0H7a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-1" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm font-medium">Created</p>
                      <p className="text-white text-sm">{new Date(interview.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm font-medium">Created By</p>
                      <p className="text-white text-sm font-medium">{interview.user?.name || 'N/A'}</p>
                    </div>
                  </div>

                  {interview.scheduledWith && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center mt-0.5">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-sm font-medium">Scheduled With</p>
                        <p className="text-white text-sm font-medium">{interview.scheduledWith?.name || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {interview.recordingUrl && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center mt-0.5">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-sm font-medium">Recording</p>
                        <a 
                          href={`${API}${interview.recordingUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm font-medium underline"
                        >
                          View Recording
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
                    <p className="text-gray-400 text-sm font-medium mb-2">Meet Link</p>
                    <code className="text-gray-300 text-xs break-all leading-relaxed block">
                      {interview.meetLink}
                    </code>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => joinInterview(interview.roomId)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Join
                  </button>
                  <button 
                    onClick={() => copyRoomLink(interview.meetLink)}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                  {interview.user.id === currentUserId && (
                    <button 
                      onClick={() => deleteInterview(interview.id)}
                      className="bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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