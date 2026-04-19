import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Home, Briefcase, FileText, Users, FileSearch, Scale, Menu, X, Mail } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { key: 'dashboard',   path: '/',         icon: <Home size={18} /> },
    { key: 'cases',       path: '/cases',     icon: <Briefcase size={18} /> },
    { key: 'notices',     path: '/notices',   icon: <Mail size={18} /> },
    { key: 'drafting',    path: '/drafting',  icon: <FileText size={18} /> },
    { key: 'research_ai', path: '/research',  icon: <FileSearch size={18} /> },
    { key: 'assign_case', path: '/team',      icon: <Users size={18} /> },
    { key: 'assigned_cases', path: '/assigned-cases', icon: <Scale size={18} /> },
  ];

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const NavLinks = ({ onNav }) => (
    <nav className="flex-1 px-3 space-y-0.5">
      {navItems.map(item => {
        const isActive = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.key}
            to={item.path}
            onClick={onNav}
            className={`nav-link${isActive ? ' active' : ''}`}
          >
            {item.icon}
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );

  const UserFooter = () => (
    <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--nav-hover-bg)' }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {user?.name || 'Advocate'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {user?.email || ''}
          </p>
        </div>
      </div>
    </div>
  );

  const Brand = () => (
    <div className="p-5 pb-4">
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#06B6D4)', color: '#F8FAFC', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}
        >
          <Scale size={18} />
        </div>
        <div>
          <p className="font-extrabold text-base leading-tight text-violet-400">
            AI<span style={{ color: 'var(--text-primary)' }}>Lawyer</span>
          </p>
          <p className="text-[0.65rem] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {t('intelligent_legal')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile hamburger button (shown on small screens) ── */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg shadow-lg"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile slide-in drawer ── */}
      <aside
        className={`sidebar fixed top-0 left-0 z-50 flex flex-col h-full w-60 transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Brand />
        <div className="mx-4 mb-3" style={{ borderBottom: '1px solid var(--border-color)' }} />
        <NavLinks onNav={() => setMobileOpen(false)} />
        <UserFooter />
      </aside>

      {/* ── Desktop permanent sidebar ── */}
      <aside
        className="sidebar hidden lg:flex flex-col flex-shrink-0 w-60"
        style={{ height: '100vh' }}
      >
        <Brand />
        <div className="mx-4 mb-3" style={{ borderBottom: '1px solid var(--border-color)' }} />
        <NavLinks onNav={() => {}} />
        <UserFooter />
      </aside>
    </>
  );
};

export default Sidebar;
