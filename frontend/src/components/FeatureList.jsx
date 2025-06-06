import React from 'react';
import { CheckCircle, Star } from 'lucide-react';
import { formatTitle } from '../utils/helpers';
import { Link } from 'react-router-dom'; // <-- Import Link

export default function FeatureList({ features }) {
  if (!features?.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-white" />
        </div>
        <p className="text-purple-200 italic">No features available for your current plan.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map(({ feature, level, quota }) => {
        const isAIInterview = feature === 'AI_INTERVIEW'; // check feature key
        const oneToone = feature === 'ONE_TO_ONE_INTERVIEW';

        const cardContent = (
          <div
            className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-purple-500/30 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                {formatTitle(feature)}
              </h4>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-purple-200">
                <span className="font-medium">Level:</span> <span className="text-white">{level}</span>
              </p>
              <p className="text-purple-200">
                <span className="font-medium">Quota:</span>
                <span className="text-white ml-1">
                  {quota === null ? 'Unlimited' : quota}
                </span>
              </p>
            </div>
          </div>
        );

        // return isAIInterview ? (
        //   <Link to="/user/services/ai-interview" key={feature}>
        //     {cardContent}
        //   </Link>
        // ) : (
        //   <div key={feature}>{cardContent}</div>
        // );

        return (isAIInterview || oneToone) ? (
          <Link
            to={isAIInterview ? "/user/services/ai-interview" : "/user/services/peer-interview"}
            key={feature}
          >
            {cardContent}
          </Link>
        ) : (
          <div key={feature}>{cardContent}</div>
        );

      })}
    </div>
  );
}
