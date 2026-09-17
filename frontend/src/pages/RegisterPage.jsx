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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5E0EC] text-[#620F3C] border border-[#620F3C]/20 text-xs font-bold mb-2 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#620F3C]" />
            Admin Registration Portal (/admin/register)
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5E0EC] text-[#620F3C] border border-[#620F3C]/20 text-xs font-bold mb-2 shadow-sm">
            <User className="w-4 h-4 text-[#620F3C]" />
            User Registration Portal (/register)
          </div>
        )}
        <h1 className="text-3xl font-bold text-[#2A081C]">
          {isAdminRoute ? 'Register as Admin' : 'Create an Account'}
        </h1>
        <p className="text-[#6E455E] text-sm">
          {isAdminRoute ? 'Set up an organizer account to publish and manage events' : 'Join EventBook to reserve seats & hold tickets'}
        </p>
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
            <label className="block text-xs font-bold text-[#2A081C] mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#620F3C]/25 text-[#2A081C] text-sm focus:outline-none focus:border-[#620F3C]"
              placeholder="e.g. Arya Dev"
              required
            />
          </div>

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
              placeholder="At least 6 characters"
              minLength="6"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2A081C] mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#620F3C]/25 text-[#2A081C] text-sm font-semibold focus:outline-none focus:border-[#620F3C]"
            >
              <option value="user">User (Browse & Hold Event Seats)</option>
              <option value="admin">Admin (Create & Manage Concerts)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#620F3C] hover:bg-[#4E0B2F] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <User className="w-4 h-4 text-white" />
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="text-center text-xs text-[#6E455E] pt-2">
          Already have an account?{' '}
          <Link to={isAdminRoute ? '/admin/login' : '/login'} className="text-[#620F3C] font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
