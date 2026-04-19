import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CaseIntake from './pages/CaseIntake';
import CaseWorkspace from './pages/CaseWorkspace';
import HearingPage from './pages/HearingPage';
import ResearchAI from './pages/ResearchAI';
import DocumentDrafting from './pages/DocumentDrafting';
import TeamManagement from './pages/TeamManagement';
import AcceptInvite from './pages/AcceptInvite';
import AssignedCases from './pages/AssignedCases';
import Notices from './pages/Notices';

// Dummy component for unbuilt routes
const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center glass-card p-12 border-violet-500/20">
      <h2 className="text-2xl font-bold mb-2 text-violet-400">{title}</h2>
      <p className="text-slate-400">This module is under construction.</p>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="cases" element={<CaseWorkspace />} />
              <Route path="notices" element={<Notices />} />
              <Route path="cases/new" element={<CaseIntake />} />
              <Route path="cases/:id" element={<CaseWorkspace />} />
              <Route path="cases/:caseId/hearings/:hearingId" element={<HearingPage />} />
              <Route path="drafting" element={<DocumentDrafting />} />
              <Route path="research" element={<ResearchAI />} />
              <Route path="team" element={<TeamManagement />} />
              <Route path="assigned-cases" element={<AssignedCases />} />
              <Route path="accept-invite/:token" element={<AcceptInvite />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
