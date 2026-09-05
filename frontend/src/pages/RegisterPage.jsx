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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5E0EC]/20 text-[#F5E0EC] border border-[#F5E0EC]/30 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-[#F5E0EC]" />
            Admin Registration Portal (/admin/register)
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5E0EC]/20 text-[#F5E0EC] border border-[#F5E0EC]/30 text-xs font-bold mb-2">
            <User className="w-4 h-4 text-[#F5E0EC]" />
            User Registration Portal (/register)
          </div>
        )}
        <h1 className="text-3xl font-bold text-[#F5E0EC]">
          {isAdminRoute ? 'Register as Admin' : 'Create an Account'}
        </h1>
        <p className="text-[#F5E0EC]/70 text-sm">
          {isAdminRoute ? 'Set up an organizer account to publish and manage events' : 'Join EventBook to reserve seats & hold tickets'}
        </p>
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
            <label className="block text-xs font-semibold text-[#F5E0EC]/80 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#32061D] border border-[#F5E0EC]/30 text-[#F5E0EC] text-sm focus:outline-none focus:border-[#F5E0EC]"
              placeholder="e.g. Arya Dev"
              required
            />
          </div>

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
              placeholder="At least 6 characters"
              minLength="6"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5E0EC]/80 mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#32061D] border border-[#F5E0EC]/30 text-[#F5E0EC] text-sm font-semibold focus:outline-none focus:border-[#F5E0EC]"
            >
              <option value="user">User (Browse & Hold Event Seats)</option>
              <option value="admin">Admin (Create & Manage Concerts)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#F5E0EC] hover:bg-[#e7cadb] text-[#620F3C] font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4 text-[#620F3C]" />
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="text-center text-xs text-[#F5E0EC]/70 pt-2">
          Already have an account?{' '}
          <Link to={isAdminRoute ? '/admin/login' : '/login'} className="text-[#F5E0EC] font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
