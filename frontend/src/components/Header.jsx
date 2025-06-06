import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Crown, Zap, Users, Calendar, Video, Target, Star, CheckCircle, Shield, Sun, Moon, LogIn, UserPlus } from 'lucide-react';
// import axios from 'axios';
import axios from '../config/config.js';

export default function Header() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

   const [darkMode, setDarkMode] = useState(() => {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('theme');
        if (saved === 'dark') return true;
        if (saved === 'light') return false;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return true; // Default to dark for glassmorphism theme
    });
  
    useEffect(() => {
      const root = window.document.documentElement;
      if (darkMode) {
        root.classList.add('dark');
        window.localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        window.localStorage.setItem('theme', 'light');
      }
    }, [darkMode]);
  

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await axios.post('/auth/verify', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        localStorage.removeItem('token');
        setUser(null);
      }
    };

    verifyToken();
  }, []);

  // If on user dashboard, return null
  if (user && location.pathname === `/user/dashboard`) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">InterviewPro</h1>
            </div>

            {/* Center Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-purple-200 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-purple-200 hover:text-white transition-colors">Pricing</a>
              <a href="#about" className="text-purple-200 hover:text-white transition-colors">About</a>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <button onClick={()=>{
                navigate("/login")
              }} className="flex items-center space-x-2 text-purple-200 hover:text-white transition-colors">
                <LogIn className="w-4 h-4" />
                <span className="font-medium">Login</span>
              </button>
              
              <button onClick={()=>{
                navigate("/register")
              }} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-lg hover:shadow-purple-500/25">
                <UserPlus className="w-4 h-4" />
                <span className="font-medium">Register</span>
              </button>

              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className="p-2 text-purple-200 hover:text-white transition-colors"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>
  );
}
