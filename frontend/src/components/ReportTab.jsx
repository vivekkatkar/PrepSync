import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Star, TrendingUp, AlertCircle, Calendar, User, Target, Brain, MessageSquare, BookOpen, Clock, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { API, getAuthHeaders } from '../utils/api';

export default function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReports, setExpandedReports] = useState({});

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await axios.get(`${API}/user/reports`, getAuthHeaders());
        setReports(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch reports');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const toggleExpanded = (reportId) => {
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'from-green-500 to-emerald-500';
    if (rating >= 3) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getInterviewTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'technical':
        return Brain;
      case 'behavioral':
        return MessageSquare;
      case 'system design':
        return Target;
      default:
        return FileText;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDelay: '0.15s' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 p-2 rounded-lg">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-red-400 font-semibold">Error Loading Reports</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center max-w-md">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full w-16 h-16 mx-auto mb-6">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">No Reports Yet</h3>
            <p className="text-purple-200 mb-6">Start an AI interview to generate your first performance report and track your progress.</p>
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl">
              Start Interview
            </button>
          </div>
        </div>
      ) : (
        reports.map((report) => {
          const IconComponent = getInterviewTypeIcon(report.type);
          const isExpanded = expandedReports[report.id];
          
          return (
            <div
              key={report.id}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow hover:shadow-2xl hover:shadow-purple-500/10 hover:bg-white/10 transition-all duration-300 overflow-hidden"
            >
              {/* Compact Header - Always Visible */}
              <div 
                className="p-6 cursor-pointer"
                onClick={() => toggleExpanded(report.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                      <IconComponent className="text-white w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-white text-lg font-semibold">{report.type} Interview</h3>
                        {/* Quick Rating Display */}
                        {report.insights.rating !== undefined && report.insights.rating !== null && (
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-white font-medium">{report.insights.rating}/5</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-2 text-purple-200 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(report.date).toLocaleString()}</span>
                        </div>
                        {/* Quick Topics Preview */}
                        {report.insights.topics_covered && report.insights.topics_covered.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-purple-300" />
                            <span className="text-purple-300 text-sm">
                              {report.insights.topics_covered.slice(0, 2).join(', ')}
                              {report.insights.topics_covered.length > 2 && ` +${report.insights.topics_covered.length - 2} more`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* Quick Status Indicators */}
                    <div className="flex space-x-2">
                      {report.insights.strengths && report.insights.strengths.length > 0 && (
                        <div className="bg-green-500/20 border border-green-500/30 rounded-full px-2 py-1">
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        </div>
                      )}
                      {report.insights.areas_for_improvement && report.insights.areas_for_improvement.length > 0 && (
                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-full px-2 py-1">
                          <Target className="w-3 h-3 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-purple-300" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-purple-300" />
                    )}
                  </div>
                </div>

                {/* Rating Bar - Always Visible */}
                {report.insights.rating !== undefined && report.insights.rating !== null && (
                  <div className="mt-4">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${getRatingColor(report.insights.rating)} transition-all duration-500`}
                        style={{ width: `${(report.insights.rating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Content - Collapsible */}
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-white/10">
                  <div className="pt-4 space-y-4">
                    {/* Two Column Layout for Better Space Usage */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-4">
                        {/* Overall Feedback */}
                        {report.insights.overall_feedback && (
                          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center mb-2">
                              <MessageSquare className="w-4 h-4 mr-2 text-purple-400" />
                              <span className="font-medium text-purple-200">Overall Feedback</span>
                            </div>
                            <p className="text-white text-sm leading-relaxed">{report.insights.overall_feedback}</p>
                          </div>
                        )}

                        {/* Strengths */}
                        {report.insights.strengths && report.insights.strengths.length > 0 && (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                              <span className="font-medium text-green-400">Strengths</span>
                            </div>
                            <p className="text-green-300 text-sm">{report.insights.strengths.join(', ')}</p>
                          </div>
                        )}

                        {/* Communication Skills */}
                        {report.insights.communication_and_soft_skills && (
                          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center mb-2">
                              <User className="w-4 h-4 mr-2 text-purple-400" />
                              <span className="font-medium text-purple-200">Communication & Soft Skills</span>
                            </div>
                            <p className="text-white text-sm">{report.insights.communication_and_soft_skills}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        {/* Areas for Improvement */}
                        {report.insights.areas_for_improvement && report.insights.areas_for_improvement.length > 0 && (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Target className="w-4 h-4 mr-2 text-yellow-400" />
                              <span className="font-medium text-yellow-400">Areas for Improvement</span>
                            </div>
                            <p className="text-yellow-300 text-sm">{report.insights.areas_for_improvement.join(', ')}</p>
                          </div>
                        )}

                        {/* Technical Feedback */}
                        {report.insights.technical_feedback && Object.keys(report.insights.technical_feedback).length > 0 && (
                          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center mb-3">
                              <Brain className="w-4 h-4 mr-2 text-purple-400" />
                              <span className="font-medium text-purple-200">Technical Feedback</span>
                            </div>
                            <div className="space-y-2">
                              {Object.entries(report.insights.technical_feedback).map(([key, value]) => (
                                value && (
                                  <div key={key} className="bg-white/5 p-2 rounded text-xs">
                                    <span className="capitalize text-white font-medium">{key.replace(/_/g, ' ')}:</span>{' '}
                                    <span className="text-purple-200">{value}</span>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Full Width Sections */}
                    {/* Topics Covered */}
                    {report.insights.topics_covered && report.insights.topics_covered.length > 0 && (
                      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center mb-3">
                          <BookOpen className="w-4 h-4 mr-2 text-purple-400" />
                          <span className="font-medium text-purple-200">Topics Covered</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {report.insights.topics_covered.map((topic, index) => (
                            <span
                              key={index}
                              className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-xs"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Questions to Revisit */}
                    {report.insights.sample_questions_to_revisit && report.insights.sample_questions_to_revisit.length > 0 && (
                      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center mb-3">
                          <Clock className="w-4 h-4 mr-2 text-purple-400" />
                          <span className="font-medium text-purple-200">Questions to Revisit</span>
                        </div>
                        <div className="space-y-2">
                          {report.insights.sample_questions_to_revisit.slice(0, 3).map((item, i) => (
                            <div key={i} className="bg-white/5 p-3 rounded border border-white/10">
                              <div className="mb-1">
                                <span className="font-semibold text-purple-400 text-xs">Q:</span>{' '}
                                <span className="text-white text-xs">{item.question.slice(0, 50)}...</span>
                              </div>
                              <div>
                                <span className="font-semibold text-yellow-400 text-xs">Reason:</span>{' '}
                                <span className="text-yellow-300 text-xs">{item.reason}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}