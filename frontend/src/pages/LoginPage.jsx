import axios from '../config/config.js';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const resp = await axios.post('/auth/login', {
        email,
        password,
      });
      localStorage.setItem('token', resp.data.token);
      navigate('/user/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || 'Login failed';
      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white/10 border border-white/20 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6">
        <h2 className="text-3xl font-extrabold text-white text-center">
          Welcome Back
        </h2>
        <p className="text-purple-200 text-center text-sm">
          Sign in to continue
        </p>

        {errorMsg && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition duration-200 shadow-lg"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center text-purple-200">
          Don’t have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            className="text-pink-400 hover:underline cursor-pointer font-medium"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
