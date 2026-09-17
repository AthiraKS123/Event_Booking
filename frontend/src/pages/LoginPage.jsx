import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import { User, Lock, XCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.includes('/admin');

  const [email, setEmail] = useState(isAdminRoute ? 'arya.admin@example.com' : 'user3@example.com');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setLoading(true);
      const res = await client.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin/events' : '/');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    const targetEmail = role === 'admin' ? 'arya.admin@example.com' : 'user3@example.com';
    setEmail(targetEmail);
    setPassword('password123');
    try {
      setLoading(true);
      const res = await client.post('/auth/login', { email: targetEmail, password: 'password123' });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin/events' : '/');
    } catch (err) {
      try {
        const regRes = await client.post('/auth/register', {
          name: role === 'admin' ? 'Arya Admin' : 'User Demo',
          email: targetEmail,
          password: 'password123',
          role,
        });
        localStorage.setItem('accessToken', regRes.data.accessToken);
        localStorage.setItem('user', JSON.stringify(regRes.data.user));
        onLoginSuccess(regRes.data.user);
        navigate(role === 'admin' ? '/admin/events' : '/');
      } catch (regErr) {
        setErrorMsg('Quick login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="text-center space-y-2">
        {isAdminRoute ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5E0EC] text-[#620F3C] border border-[#620F3C]/20 text-xs font-bold mb-2 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#620F3C]" />
            Admin Sign In Portal (/admin/login)
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5E0EC] text-[#620F3C] border border-[#620F3C]/20 text-xs font-bold mb-2 shadow-sm">
            <User className="w-4 h-4 text-[#620F3C]" />
            User Sign In Portal (/login)
          </div>
        )}
        <h1 className="text-3xl font-bold text-[#2A081C]">
          {isAdminRoute ? 'Admin Sign In' : 'Sign In to EventBook'}
        </h1>
        <p className="text-[#6E455E] text-sm">Enter your credentials to access live event seat holding</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 text-sm">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-white border border-[#620F3C]/12 shadow-md space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2A081C] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#620F3C]/25 text-[#2A081C] text-sm focus:outline-none focus:border-[#620F3C]"
              placeholder="e.g. user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2A081C] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#620F3C]/25 text-[#2A081C] text-sm focus:outline-none focus:border-[#620F3C]"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#620F3C] hover:bg-[#4E0B2F] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Lock className="w-4 h-4 text-white" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#620F3C]/10"></div>
          <span className="flex-shrink mx-4 text-xs text-[#6E455E] font-semibold uppercase">Or 1-Click Quick Demo Login</span>
          <div className="flex-grow border-t border-[#620F3C]/10"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickLogin('user')}
            className="py-2.5 rounded-xl bg-[#FAF6F9] hover:bg-[#F5E0EC] text-[#620F3C] border border-[#620F3C]/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <User className="w-3.5 h-3.5 text-[#620F3C]" />
            User Demo
          </button>
          <button
            onClick={() => handleQuickLogin('admin')}
            className="py-2.5 rounded-xl bg-[#FAF6F9] hover:bg-[#F5E0EC] text-[#620F3C] border border-[#620F3C]/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#620F3C]" />
            Admin Demo
          </button>
        </div>

        <div className="text-center text-xs text-[#6E455E] pt-2">
          Don't have an account?{' '}
          <Link to={isAdminRoute ? '/admin/register' : '/register'} className="text-[#620F3C] font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
