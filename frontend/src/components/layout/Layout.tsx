import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import {
  LayoutDashboard,
  Terminal,
  MessageSquareCode,
  Activity,
  GitCompare,
  User,
  ChevronDown,
  PhoneCall
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const profile = 'Senior Solutions Eng';
  const { fetchVersions } = useAppStore();

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Prompt Studio', href: '/studio', icon: Terminal },
    { name: 'Conversation Simulator', href: '/simulator', icon: MessageSquareCode },
    { name: 'Transcript Analyzer', href: '/analyzer', icon: Activity },
    { name: 'Prompt Evolution', href: '/evolution', icon: GitCompare },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] overflow-hidden font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0c0c0e] border-r border-[#1f1f23] flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Header/Logo */}
          <div className="h-16 px-6 flex items-center border-b border-[#1f1f23] gap-2.5">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <PhoneCall className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-none tracking-tight">Voice Agent Studio</h1>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Internal QA</span>
            </div>
          </div>

          {/* Profile Switcher */}
          <div className="px-4 py-3 border-b border-[#1f1f23]">
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-900 cursor-pointer transition-colors border border-transparent hover:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-xs font-medium text-zinc-300">{profile}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-md text-xs font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm shadow-indigo-500/5'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`} />
                  {item.name}
                  {isActive && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#1f1f23] bg-[#0c0c0e]">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Local Mock Sandbox</span>
          </div>
          <p className="text-[10px] text-zinc-600 font-mono leading-relaxed">
            FastAPI: Simulated<br />
            SQLite: Mock Session Storage
          </p>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#09090b] overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
