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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] text-[#DE5D3B] border border-[#DE5D3B]/20 text-xs font-bold mb-2 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#DE5D3B]" />
            Admin Sign In Portal (/admin/login)
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] text-[#DE5D3B] border border-[#DE5D3B]/20 text-xs font-bold mb-2 shadow-xs">
            <User className="w-4 h-4 text-[#DE5D3B]" />
            User Sign In Portal (/login)
          </div>
        )}
        <h1 className="text-3xl font-bold text-[#1C2434]">
          {isAdminRoute ? 'Admin Sign In' : 'Sign In to EventBook'}
        </h1>
        <p className="text-[#676C75] text-sm">Enter your credentials to access live event seat holding</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 text-sm">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-white border border-[#EBE5DC] shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1C2434] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#EBE5DC] text-[#1C2434] text-sm focus:outline-none focus:border-[#DE5D3B]"
              placeholder="e.g. user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C2434] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#EBE5DC] text-[#1C2434] text-sm focus:outline-none focus:border-[#DE5D3B]"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Lock className="w-4 h-4 text-white" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#EBE5DC]"></div>
          <span className="flex-shrink mx-4 text-xs text-[#676C75] font-semibold uppercase">Or 1-Click Quick Demo Login</span>
          <div className="flex-grow border-t border-[#EBE5DC]"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickLogin('user')}
            className="py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#FDF2EC] text-[#DE5D3B] border border-[#DE5D3B]/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <User className="w-3.5 h-3.5 text-[#DE5D3B]" />
            User Demo
          </button>
          <button
            onClick={() => handleQuickLogin('admin')}
            className="py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#FDF2EC] text-[#DE5D3B] border border-[#DE5D3B]/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#DE5D3B]" />
            Admin Demo
          </button>
        </div>

        <div className="text-center text-xs text-[#676C75] pt-2">
          Don't have an account?{' '}
          <Link to={isAdminRoute ? '/admin/register' : '/register'} className="text-[#DE5D3B] font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
