import React from 'react';
import { CheckCircle, Star, ArrowRight, Zap, Users, Infinity } from 'lucide-react';
import { formatTitle } from '../utils/helpers';
import { Link } from 'react-router-dom';

export default function FeatureList({ features }) {
  if (!features?.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
          <Star className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Features Available</h3>
        <p className="text-slate-400">Upgrade your plan to access more features.</p>
      </div>
    );
  }

  const getFeatureIcon = (feature) => {
    if (feature === 'AI_INTERVIEW') return Zap;
    if (feature === 'ONE_TO_ONE_INTERVIEW') return Users;
    return CheckCircle;
  };

  const getIconWrapperStyle = (feature) => {
    if (feature === 'AI_INTERVIEW') return 'bg-gradient-to-br from-blue-500/20 to-blue-800/30 border border-blue-400/20';
    if (feature === 'ONE_TO_ONE_INTERVIEW') return 'bg-gradient-to-br from-emerald-500/20 to-emerald-800/30 border border-emerald-400/20';
    return 'bg-gradient-to-br from-purple-500/20 to-purple-800/30 border border-purple-400/20';
  };

  const getFeatureColor = (feature) => {
    if (feature === 'AI_INTERVIEW') return 'text-blue-400';
    if (feature === 'ONE_TO_ONE_INTERVIEW') return 'text-emerald-400';
    return 'text-purple-400';
  };

  const getHoverShadow = (feature) => {
    if (feature === 'AI_INTERVIEW') return 'hover:shadow-blue-400/20';
    if (feature === 'ONE_TO_ONE_INTERVIEW') return 'hover:shadow-emerald-400/20';
    return 'hover:shadow-purple-400/20';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map(({ feature, level, quota }) => {
        const isAIInterview = feature === 'AI_INTERVIEW';
        const oneToOne = feature === 'ONE_TO_ONE_INTERVIEW';
        const isClickable = isAIInterview || oneToOne;

        const FeatureIcon = getFeatureIcon(feature);
        const iconColor = getFeatureColor(feature);
        const iconWrapperStyle = getIconWrapperStyle(feature);
        const hoverShadow = getHoverShadow(feature);

        const cardContent = (
          <div className={`
            relative rounded-2xl p-6 backdrop-blur-md border 
            bg-slate-900/60 border-slate-700/40 
            transition-transform duration-300 ease-out
            hover:bg-slate-800/50 hover:scale-[1.025]
            ${hoverShadow}
            ${isClickable ? 'cursor-pointer hover:shadow-lg' : ''}
          `}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-inner ${iconWrapperStyle}`}>
                  <FeatureIcon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h4 className="text-lg font-semibold text-white">
                  {formatTitle(feature)}
                </h4>
              </div>

              {isClickable && (
                <ArrowRight className="w-5 h-5 text-white/30 opacity-0 transform transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1" />
              )}
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                <span className="text-sm font-medium text-slate-300">Level</span>
                <span className="text-sm font-semibold text-white bg-slate-800/60 px-3 py-1 rounded-md border border-slate-600/40">
                  {level}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-slate-300">Quota</span>
                <div className="flex items-center gap-2">
                  {quota === null && <Infinity className="w-4 h-4 text-emerald-400" />}
                  <span className={`text-sm font-semibold px-3 py-1 rounded-md border ${
                    quota === null 
                      ? 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30' 
                      : 'text-white bg-slate-800/50 border-slate-600/40'
                  }`}>
                    {quota === null ? 'Unlimited' : quota}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

        return (isClickable) ? (
          <Link
            to={isAIInterview ? "/user/services/ai-interview" : "/user/services/peer-interview"}
            key={feature}
            className="block group"
          >
            {cardContent}
          </Link>
        ) : (
          <div key={feature}>
            {cardContent}
          </div>
        );
      })}
    </div>
  );
}
