import { User, FileText, Crown, CheckCircle, Star, Zap, Shield } from 'lucide-react';

export  const getPlanColor = (planName) => {
    switch (planName) {
      case 'FREE': return 'from-gray-500 to-gray-600';
      case 'PRO': return 'from-purple-500 to-pink-500';
      case 'ENTERPRISE': return 'from-yellow-500 to-orange-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  
  export const getPlanIcon = (planName) => {
    switch (planName) {
      case 'FREE': return Star;
      case 'PRO': return Zap;
      case 'ENTERPRISE': return Shield;
      default: return Star;
    }
  };

  export const addPlansDesign = (plans) => {
    return plans.map(plan => {
      let design = {};
      if (plan.plan === 'FREE') {
        design = {
          id: 'FREE',
          name: 'Free',
          price: '$0',
          color: 'from-gray-500 to-gray-600',
          icon: Star,
          description: 'Perfect for getting started'
        };
      } else if (plan.plan === 'PRO') {
        design = {
          id: 'PRO',
          name: 'Pro',
          price: '$29',
          color: 'from-purple-500 to-pink-500',
          icon: Zap,
          description: 'For professionals and growing teams'
        };
      } else if (plan.plan === 'ENTERPRISE') {
        design = {
          id: 'ENTERPRISE',
          name: 'Enterprise',
          price: '$99',
          color: 'from-yellow-500 to-orange-500',
          icon: Shield,
          description: 'Advanced features for large organizations'
        };
      }
      return {
        ...design,
        features: plan.features
      };
    });
  };

