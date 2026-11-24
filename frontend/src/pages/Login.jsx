import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Building2, User, ArrowLeft } from 'lucide-react';

export default function Login({ onBackToLanding, initialRole = 'admin' }) {
  const { login } = useAuth();
  const [role, setRole] = useState(initialRole); // 'admin' or 'employee'
  const [email, setEmail] = useState(initialRole === 'admin' ? 'admin@compliance.org' : 'employee1@compliance.org');
  const [password, setPassword] = useState(initialRole === 'admin' ? 'AdminPassword2026!' : 'EmployeePass2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialRole) {
      handleRoleSwitch(initialRole);
    }
  }, [initialRole]);

  const handleRoleSwitch = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    if (selectedRole === 'admin') {
      setEmail('admin@compliance.org');
      setPassword('AdminPassword2026!');
    } else {
      setEmail('employee1@compliance.org');
      setPassword('EmployeePass2026!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== role) {
        // Warning if role switched accidentally
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {onBackToLanding && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 px-4 sm:px-0">
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-navy-dark transition-colors py-1 px-2.5 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Product Overview</span>
          </button>
        </div>
      )}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-navy-dark flex items-center justify-center text-teal-accent shadow-lg shadow-navy-dark/10">
            <ShieldCheck className="w-8 h-8 text-teal-accent" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-navy-dark">
          ReguComply AI
        </h2>
        <p className="mt-1 text-center text-sm text-text-secondary max-w-sm mx-auto">
          AI-Powered Regulatory Compliance Communication System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl border border-gray-200/80 sm:px-10">
          
          {/* Role Selection Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6 border border-gray-200">
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                role === 'admin'
                  ? 'bg-navy-dark text-white shadow-sm'
                  : 'text-text-secondary hover:text-navy-dark'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Administrator
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('employee')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                role === 'employee'
                  ? 'bg-navy-dark text-white shadow-sm'
                  : 'text-text-secondary hover:text-navy-dark'
              }`}
            >
              <User className="w-4 h-4" />
              Employee Portal
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-status-error font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Corporate Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'admin' ? 'admin@compliance.org' : 'employee1@compliance.org'}
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-accent focus:border-teal-accent text-text-primary outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-accent focus:border-teal-accent text-text-primary outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-navy-dark hover:bg-navy-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-accent disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {role === 'admin' ? 'Administrator' : 'Employee'}</span>
                  <ArrowRight className="w-4 h-4 text-teal-accent" />
                </>
              )}
            </button>
          </form>

          {/* Preset Quick Fill Demo Buttons */}
          <div className="mt-6 pt-5 border-t border-gray-200">
            <span className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2.5 text-center">
              Quick Test Credentials
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setEmail('admin@compliance.org');
                  setPassword('AdminPassword2026!');
                }}
                className="text-left text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-teal-accent hover:bg-teal-light/20 flex items-center justify-between text-navy-dark font-medium transition-colors"
              >
                <span>🔑 Administrator</span>
                <span className="text-[11px] text-text-secondary">admin@compliance.org</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('employee');
                  setEmail('employee1@compliance.org');
                  setPassword('EmployeePass2026!');
                }}
                className="text-left text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-teal-accent hover:bg-teal-light/20 flex items-center justify-between text-navy-dark font-medium transition-colors"
              >
                <span>👤 Employee 1 (Alice - Ops)</span>
                <span className="text-[11px] text-text-secondary">employee1@compliance.org</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('employee');
                  setEmail('employee2@compliance.org');
                  setPassword('EmployeePass2026!');
                }}
                className="text-left text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-teal-accent hover:bg-teal-light/20 flex items-center justify-between text-navy-dark font-medium transition-colors"
              >
                <span>👤 Employee 2 (Bob - Risk)</span>
                <span className="text-[11px] text-text-secondary">employee2@compliance.org</span>
              </button>
            </div>
            <p className="mt-3 text-[10px] text-center text-text-muted leading-tight">
              Memento memory is isolated between Employee 1 and Employee 2 to verify multi-tenant privacy.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
