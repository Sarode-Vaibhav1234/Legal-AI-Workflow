import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Sun, Moon, LogOut } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'bn', label: 'বাংলা' },
];

const MainLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('i18n_language', lang);
  };

  // Get user initials
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="topbar pl-14 lg:pl-4">
          {/* Language Selector */}
          <select
            id="language-selector"
            className="lang-select"
            value={i18n.language}
            onChange={handleLanguageChange}
            aria-label="Select language"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Info + Logout */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
              title={user?.name}
            >
              {initials}
            </div>
            <span
              className="text-sm font-medium hidden sm:block"
              style={{ color: 'var(--text-secondary)' }}
            >
              {user?.name}
            </span>
          </div>

          <button
            id="logout-btn"
            className="logout-btn"
            onClick={logout}
            aria-label={t('logout')}
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
