import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query';
import CoverOnesLayout from './components/layout/CoverOnesLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmailSent from './pages/VerifyEmailSent';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import JobBoardPage from './pages/JobBoardPage';
import PostJobPage from './pages/PostJobPage';
import JobDetailPage from './pages/JobDetailPage';
import MyBidsPage from './pages/MyBidsPage';
import MyContractsPage from './pages/MyContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import KycPage from './pages/KycPage';
import MessagesPlaceholderPage from './pages/MessagesPlaceholderPage';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import { FeatureRoute } from './features/flags/FeatureRoute';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/verify-sent" element={<VerifyEmailSent />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected app routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CoverOnesLayout />
              </ProtectedRoute>
            }
          >
            {/* / redirects to /jobs; Homepage dashboard is P2 */}
            <Route index element={<Navigate to="/jobs" replace />} />

            {/* Marketplace */}
            <Route path="jobs" element={<JobBoardPage />} />
            <Route path="jobs/new" element={<PostJobPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />

            {/* Bids */}
            <Route path="bids" element={<MyBidsPage />} />

            {/* KYC onboarding */}
            <Route path="kyc" element={<KycPage />} />

            {/* Contracts */}
            <Route path="contracts" element={<MyContractsPage />} />
            <Route path="contracts/:id" element={<ContractDetailPage />} />

            {/*
             * 訊息 — routes to placeholder page (chat deferred, backend not built).
             * Locked decision 2026-06-04: DO NOT un-park chat here.
             * When chat flag is false the FeatureRoute shows the placeholder anyway,
             * but we bypass it by rendering MessagesPlaceholderPage directly since
             * the placeholder IS the intended UX for this phase.
             */}
            <Route path="messages" element={<MessagesPlaceholderPage />} />

            {/* Contacts (gated — no backend yet) */}
            <Route
              path="contacts"
              element={
                <FeatureRoute flag="contacts" feature="聯絡人" description="聯絡人功能正在開發中，敬請期待。">
                  <Contacts />
                </FeatureRoute>
              }
            />

            {/* Settings (gated) */}
            <Route
              path="settings"
              element={
                <FeatureRoute flag="avatarSettings" feature="設定" description="個人設定功能正在開發中，敬請期待。">
                  <Settings />
                </FeatureRoute>
              }
            />

            {/* 404 within the app shell */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Top-level 404 catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
