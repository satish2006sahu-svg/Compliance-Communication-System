import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-navy-dark flex items-center justify-center text-teal-accent shadow-sm">
          <ShieldCheck className="w-5 h-5 text-teal-accent" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy-dark tracking-tight text-base">ReguComply AI</span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-light text-navy-dark tracking-wider">
              {isAdmin ? 'Admin Console' : 'Employee Portal'}
            </span>
          </div>
          <p className="text-xs text-text-secondary hidden sm:block">Regulatory Compliance Communication System</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Badge */}
        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-text-primary">{user?.name}</div>
            <div className="text-xs text-text-secondary capitalize">{user?.role}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-navy-secondary text-white flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-status-error hover:bg-red-50 transition-colors border border-gray-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
