import React, { useState, useEffect } from 'react';
import { Crown, Zap, Users, Calendar, Video, Target, Star, CheckCircle, Shield, Sun, Moon, LogIn, UserPlus } from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function LandingPage() {
 
  // Feature cards data with matching icons
  const features = [
    {
      icon: Zap,
      title: 'AI-Driven Mock Interviews',
      description: 'Simulate realistic interviews with instant AI feedback tailored to your profile.',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Target,
      title: 'Smart Resume Analyzer',
      description: 'Optimize your resume with AI-powered critiques and suggestions for every section.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Live Peer & Mentor Sessions',
      description: 'Connect with peers or industry mentors for real-time practice and advice.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Calendar,
      title: 'Integrated Scheduling',
      description: 'Manage interviews seamlessly with calendar sync and automatic reminders.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Video,
      title: 'Session Recording',
      description: 'Review your mock interviews later with recorded video and AI analytics.',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: Crown,
      title: 'Personalized Job Matches',
      description: 'Get curated job recommendations that align with your skills and goals.',
      gradient: 'from-indigo-500 to-purple-500'
    },
  ];

  // Subscription plans with matching styling
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      icon: Star,
      gradient: 'from-gray-500 to-gray-600',
      features: [
        'AI mock interviews (basic)',
        'Peer-to-peer practice',
        'Basic resume feedback',
        'Community forum access',
        'Limited interview topics',
      ],
      highlight: false,
    },
    {
      name: 'Professional',
      price: '$29/mo',
      icon: Zap,
      gradient: 'from-purple-500 to-pink-500',
      features: [
        'Advanced AI scoring & feedback',
        'Mentor-led sessions',
        'Detailed resume suggestions',
        'Interview recordings',
        'Full interview topic library',
      ],
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      icon: Shield,
      gradient: 'from-yellow-500 to-orange-500',
      features: [
        'Dedicated career coaching',
        'API & calendar integrations',
        'In-depth analytics',
        'Unlimited recordings',
        'Custom resume creation',
      ],
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white transition-colors duration-300">
      {/* Fixed Header with Glassmorphism */}
      
      <Header />

      {/* Main Content */}
      <main className="pt-24 max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <section className="text-center py-24 max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <Crown className="w-4 h-4 text-purple-400 mr-2" />
              <span className="text-purple-200 text-sm font-medium">AI-Powered Interview Mastery</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Master Your Interviews with{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI-Powered Practice
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-purple-200 mb-12 leading-relaxed">
            Personalized mock interviews, smart resume analysis, and live sessions—designed to help you land
            your dream job with confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-105">
              Get Started for Free
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all">
              Watch Demo
            </button>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-purple-200">Everything you need to ace your next interview</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description, gradient }, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:border-purple-500/30 transition-all group hover:bg-white/15"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  {title}
                </h3>
                <p className="text-purple-200 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Subscription Plans */}
        <section id="pricing" className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h2>
            <p className="text-xl text-purple-200">Flexible pricing for every career stage</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map(({ name, price, icon: Icon, gradient, features, highlight }, idx) => (
              <div
                key={idx}
                className={`relative bg-white/10 backdrop-blur-sm rounded-xl p-8 border-2 transition-all ${
                  highlight 
                    ? 'border-purple-500 bg-purple-500/20 scale-105 shadow-2xl shadow-purple-500/25' 
                    : 'border-white/20 hover:border-white/40 hover:bg-white/15'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
                  <p className="text-4xl font-bold text-white mb-2">
                    {price}
                    {price !== 'Free' && price !== 'Custom' && <span className="text-lg text-purple-200">/month</span>}
                  </p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    highlight
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/25'
                      : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  {price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-24">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Ace Your Next Interview?</h2>
            <p className="text-xl text-purple-200 mb-8">
              Join thousands of professionals who have landed their dream jobs using InterviewPro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all">
                Start Free Trial
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all">
                Schedule Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}