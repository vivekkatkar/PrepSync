
import { Crown, Zap, Users, Calendar, Video, Target, Star, CheckCircle, Shield, Sun, Moon, LogIn, UserPlus } from 'lucide-react';

export default function Footer(){
    return <footer className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">InterviewPro</h3>
              </div>
              <p className="text-purple-200 mb-4">
                Empowering professionals to master interviews and land their dream careers through AI-powered practice and mentorship.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-purple-200 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-purple-200 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-purple-200 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-purple-200 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-purple-200 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-purple-200 hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-purple-200">
              &copy; {new Date().getFullYear()} InterviewPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
}