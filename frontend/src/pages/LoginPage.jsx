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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5E0EC]/20 text-[#F5E0EC] border border-[#F5E0EC]/30 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-[#F5E0EC]" />
            Admin Sign In Portal (/admin/login)
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5E0EC]/20 text-[#F5E0EC] border border-[#F5E0EC]/30 text-xs font-bold mb-2">
            <User className="w-4 h-4 text-[#F5E0EC]" />
            User Sign In Portal (/login)
          </div>
        )}
        <h1 className="text-3xl font-bold text-[#F5E0EC]">
          {isAdminRoute ? 'Admin Sign In' : 'Sign In to EventBook'}
        </h1>
        <p className="text-[#F5E0EC]/70 text-sm">Enter your credentials to access live event seat holding</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#4A0A2C] border border-[#F5E0EC]/30 text-[#F5E0EC] flex items-center gap-3 text-sm">
          <XCircle className="w-5 h-5 text-[#F5E0EC]/70 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-[#4A0A2C] border border-[#F5E0EC]/25 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#F5E0EC]/80 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#32061D] border border-[#F5E0EC]/30 text-[#F5E0EC] text-sm focus:outline-none focus:border-[#F5E0EC]"
              placeholder="e.g. user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5E0EC]/80 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#32061D] border border-[#F5E0EC]/30 text-[#F5E0EC] text-sm focus:outline-none focus:border-[#F5E0EC]"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#F5E0EC] hover:bg-[#e7cadb] text-[#620F3C] font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-[#620F3C]" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#F5E0EC]/20"></div>
          <span className="flex-shrink mx-4 text-xs text-[#F5E0EC]/70 font-semibold uppercase">Or 1-Click Quick Demo Login</span>
          <div className="flex-grow border-t border-[#F5E0EC]/20"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickLogin('user')}
            className="py-2.5 rounded-xl bg-[#32061D] hover:bg-[#4A0A2C] text-[#F5E0EC] border border-[#F5E0EC]/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            User Demo
          </button>
          <button
            onClick={() => handleQuickLogin('admin')}
            className="py-2.5 rounded-xl bg-[#32061D] hover:bg-[#4A0A2C] text-[#F5E0EC] border border-[#F5E0EC]/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Demo
          </button>
        </div>

        <div className="text-center text-xs text-[#F5E0EC]/70 pt-2">
          Don't have an account?{' '}
          <Link to={isAdminRoute ? '/admin/register' : '/register'} className="text-[#F5E0EC] font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
