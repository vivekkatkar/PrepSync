import React from 'react';
import { Crown, Zap, Users, Calendar, Video, Target, Star, CheckCircle, Shield } from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function LandingPage() {
  const features = [
    {
      icon: Zap,
      title: 'AI-Driven Mock Interviews',
      description: 'Simulate realistic interviews with instant AI feedback tailored to your profile.',
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      icon: Target,
      title: 'Smart Resume Analyzer',
      description: 'Optimize your resume with AI-powered critiques and suggestions for every section.',
      gradient: 'from-fuchsia-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Live Peer & Mentor Sessions',
      description: 'Connect with peers or industry mentors for real-time practice and advice.',
      gradient: 'from-sky-500 to-cyan-500'
    },
    {
      icon: Calendar,
      title: 'Integrated Scheduling',
      description: 'Manage interviews seamlessly with calendar sync and automatic reminders.',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Video,
      title: 'Session Recording',
      description: 'Review your mock interviews later with recorded video and AI analytics.',
      gradient: 'from-rose-500 to-red-500'
    },
    {
      icon: Crown,
      title: 'Personalized Job Matches',
      description: 'Get curated job recommendations that align with your skills and goals.',
      gradient: 'from-yellow-500 to-orange-500'
    },
  ];

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      icon: Star,
      gradient: 'from-gray-700 to-gray-800',
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
      gradient: 'from-purple-600 to-pink-600',
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
      gradient: 'from-yellow-500 to-orange-600',
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] text-white font-sans">
      <Header />
      <main className="pt-24 max-w-7xl mx-auto px-6">
        <section className="text-center py-24 max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur rounded-full border border-white/20 mb-6">
            <Crown className="w-4 h-4 text-purple-400 mr-2" />
            <span className="text-purple-200 text-sm font-medium">AI-Powered Interview Mastery</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Master Your Interviews with{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI-Powered Practice</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12">
            Personalized mock interviews, smart resume analysis, and live sessions—designed to help you land your dream job.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-8 py-4 bg-white text-black font-semibold rounded-xl shadow hover:scale-105 transition-all">
              Get Started for Free
            </button>
            <button className="px-8 py-4 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all">
              Watch Demo
            </button>
          </div>
        </section>

        <section id="features" className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400">Everything you need to ace your next interview</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description, gradient }, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-purple-400 transition-all hover:scale-[1.03] backdrop-blur-md"
              >
                <div className={`w-14 h-14 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
                <p className="text-sm text-gray-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-400">Flexible pricing for every career stage</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map(({ name, price, icon: Icon, gradient, features, highlight }, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl p-6 border-2 ${highlight ? 'border-purple-500 shadow-lg scale-[1.05]' : 'border-white/10'} bg-white/5 backdrop-blur-md transition-all`}
              >
                {highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-xs">Most Popular</span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                  <p className="text-3xl font-bold text-white">
                    {price}
                    {price !== 'Free' && price !== 'Custom' && <span className="text-sm text-gray-400">/mo</span>}
                  </p>
                </div>
                <ul className="space-y-3 text-sm mb-6">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-md font-semibold ${highlight ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'} transition-all`}>
                  {price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center py-24">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 border border-white/10 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Ace Your Next Interview?</h2>
            <p className="text-lg text-gray-300 mb-6">
              Join thousands of professionals who have landed their dream jobs using InterviewPro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:scale-105 transition-all">
                Start Free Trial
              </button>
              <button className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all">
                Schedule Demo
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}