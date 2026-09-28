import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { authService } from '../services/auth.service';
import { DEMO_USERS } from '../mock/mockData';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  KeyRound,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const stateMessage = (location.state as any)?.message;
  const registeredEmail = (location.state as any)?.registeredEmail;
  const redirectTarget = (location.state as any)?.from?.pathname;

  const [email, setEmail] = useState(registeredEmail || 'rajesh.patil@omkara-engg.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide your registered email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      login(res.token, res.user);

      // Route based on role & target
      if (res.user.role === 'OFFICER' || res.user.role === 'ADMIN') {
        navigate(redirectTarget || '/officer/dashboard');
      } else {
        // Citizen must reach Citizen Dashboard (Step 3) before starting an application
        navigate(redirectTarget && redirectTarget !== '/start-assessment' ? redirectTarget : '/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (role: 'citizen' | 'officer' | 'admin') => {
    const demo = DEMO_USERS[role];
    setEmail(demo.user.email);
    setPassword(demo.password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 border-b border-blue-900/50">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <KeyRound className="w-4 h-4" />
              <span>Step 2: Citizen & Officer Authentication</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Single Window Login</h1>
            <p className="text-xs text-blue-200 mt-1">
              Access your industrial approvals, track SLA timers, and manage compliance.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Flash Info if coming from Signup or Protected Route */}
            {stateMessage && (
              <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-medium flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{stateMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Demo Credential Pills */}
            <div className="mb-6 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
              <div className="text-[11px] font-bold text-amber-900 mb-2 flex items-center justify-between">
                <span>⚡ Quick Demo Switch (Hackathon Evaluation):</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('citizen')}
                  className="px-2 py-1.5 bg-white hover:bg-amber-100 text-slate-800 rounded-lg border border-amber-300 transition text-center shadow-2xs"
                >
                  Citizen (Rajesh)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('officer')}
                  className="px-2 py-1.5 bg-white hover:bg-amber-100 text-slate-800 rounded-lg border border-amber-300 transition text-center shadow-2xs"
                >
                  Officer (MPCB)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  className="px-2 py-1.5 bg-white hover:bg-amber-100 text-slate-800 rounded-lg border border-amber-300 transition text-center shadow-2xs"
                >
                  State Admin
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="loginEmail">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="loginEmail"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="rajesh.patil@omkara-engg.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700" htmlFor="loginPassword">
                    Password *
                  </label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('For testing, default password is: Password@123'); }} className="text-[11px] text-blue-700 hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="loginPassword"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Access Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-gray-500">
              <span>New industrial unit? </span>
              <Link to="/signup" className="text-blue-700 font-bold hover:underline">
                Register (Step 1: Signup)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
