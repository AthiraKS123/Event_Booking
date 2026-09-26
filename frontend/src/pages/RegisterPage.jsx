import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import { User, Lock, XCircle, ShieldCheck } from 'lucide-react';

export default function RegisterPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.includes('/admin');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(isAdminRoute ? 'admin' : 'user');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(isAdminRoute ? 'admin' : 'user');
  }, [isAdminRoute]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setLoading(true);
      const res = await client.post('/auth/register', { name, email, password, role });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin/events' : '/');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="text-center space-y-2">
        {isAdminRoute ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] dark:bg-[#1E2838] text-[#DE5D3B] dark:text-[#FF6B4A] border border-[#DE5D3B]/20 dark:border-[#FF6B4A]/30 text-xs font-bold mb-2 shadow-xs transition-colors">
            <ShieldCheck className="w-4 h-4 text-[#DE5D3B] dark:text-[#FF6B4A]" />
            Admin Registration Portal (/admin/register)
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] dark:bg-[#1E2838] text-[#DE5D3B] dark:text-[#FF6B4A] border border-[#DE5D3B]/20 dark:border-[#FF6B4A]/30 text-xs font-bold mb-2 shadow-xs transition-colors">
            <User className="w-4 h-4 text-[#DE5D3B] dark:text-[#FF6B4A]" />
            User Registration Portal (/register)
          </div>
        )}
        <h1 className="text-3xl font-bold text-[#1C2434] dark:text-[#F3F5F9] transition-colors">
          {isAdminRoute ? 'Register as Admin' : 'Create an Account'}
        </h1>
        <p className="text-[#676C75] dark:text-[#94A3B8] text-sm transition-colors">
          {isAdminRoute ? 'Set up an organizer account to publish and manage events' : 'Join EventBook to reserve seats & hold tickets'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 flex items-center gap-3 text-sm">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] shadow-sm space-y-6 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1C2434] dark:text-[#F3F5F9] mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
              placeholder="e.g. Arya Dev"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C2434] dark:text-[#F3F5F9] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
              placeholder="e.g. user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C2434] dark:text-[#F3F5F9] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
              placeholder="At least 6 characters"
              minLength="6"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C2434] dark:text-[#F3F5F9] mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E2838] border border-[#EBE5DC] dark:border-[#283548] text-[#1C2434] dark:text-[#F3F5F9] text-sm font-semibold focus:outline-none focus:border-[#DE5D3B] dark:focus:border-[#FF6B4A] transition-colors"
            >
              <option value="user" className="dark:bg-[#1E2838] dark:text-[#F3F5F9]">User (Browse & Hold Event Seats)</option>
              <option value="admin" className="dark:bg-[#1E2838] dark:text-[#F3F5F9]">Admin (Create & Manage Concerts)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E55A3A] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <User className="w-4 h-4 text-white" />
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="text-center text-xs text-[#676C75] dark:text-[#94A3B8] pt-2 transition-colors">
          Already have an account?{' '}
          <Link to={isAdminRoute ? '/admin/login' : '/login'} className="text-[#DE5D3B] dark:text-[#FF6B4A] font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
