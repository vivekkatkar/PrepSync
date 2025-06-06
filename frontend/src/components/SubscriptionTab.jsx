import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Crown, Star, Zap, Shield } from 'lucide-react';
import { API, getAuthHeaders } from '../utils/api';

export default function SubscriptionTab({ currentPlan, onPlanChange }) {
  const [selected, setSelected] = useState(currentPlan || '');
  const [userPlan, setUserPlan] = useState('');
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const res = await axios.get(`${API}/user/features`, getAuthHeaders());
        setUserPlan(res.data.plan);
        setSelected(res.data.plan);
        setFeatures(res.data.features || []);
      } catch (err) {
        console.error('Error fetching features:', err);
        setError('Could not load subscription features');
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  const changePlan = async () => {
    if (!selected || selected === userPlan) return;
    setError('');
    setUpdating(true);

    try {
      await axios.put(
        `${API}/user/subscription`,
        { plan: selected },
        getAuthHeaders()
      );

      onPlanChange(selected);
      setUserPlan(selected);
    } catch (err) {
      console.error('Failed to change plan:', err);
      setError('Failed to update plan');
    } finally {
      setUpdating(false);
    }
  };

  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      price: '$0',
      color: 'from-gray-500 to-gray-600',
      icon: Star,
      description: 'Perfect for getting started'
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '$29',
      color: 'from-purple-500 to-pink-500',
      icon: Zap,
      description: 'For professionals and growing teams'
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: '$99',
      color: 'from-yellow-500 to-orange-500',
      icon: Shield,
      description: 'Advanced features for large organizations'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-200">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Status */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Current Subscription</h3>
            <p className="text-purple-200">You are currently on the <span className="font-semibold text-purple-400">{userPlan}</span> plan</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${plans.find(p => p.id === userPlan)?.color || 'from-gray-500 to-gray-600'} text-white font-medium`}>
              {React.createElement(plans.find(p => p.id === userPlan)?.icon || Star, { className: "w-4 h-4 mr-2" })}
              {userPlan}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Selection */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-6">Choose Your Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const isCurrentPlan = plan.id === userPlan;
            const isSelected = plan.id === selected;

            return (
              <div
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`relative bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-purple-500 bg-purple-500/20' : 'border-white/20 hover:border-white/40'
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                  <p className="text-3xl font-bold text-white mb-2">{plan.price}<span className="text-sm text-purple-200">/month</span></p>
                  <p className="text-purple-200 text-sm">{plan.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Plan Change Button */}
        <div className="flex justify-center">
          <button
            onClick={changePlan}
            disabled={updating || selected === userPlan}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
              updating || selected === userPlan
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-purple-500/25'
            }`}
          >
            {updating ? 'Updating Plan...' : selected === userPlan ? 'Current Plan' : 'Change Plan'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 font-medium text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Features List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-6">Plan Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.length === 0 ? (
            <p className="text-purple-200 italic col-span-full text-center py-8">
              No features available for this plan.
            </p>
          ) : (
            features.map(({ feature, quota }) => (
              <div key={feature} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-medium text-white capitalize mb-1">
                  {feature.replace(/_/g, ' ')}
                </h4>
                <p className="text-purple-200 text-sm">
                  Quota: <span className="font-semibold">{quota === null ? 'Unlimited' : quota}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
