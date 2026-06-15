import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query';
import CoverOnesLayout from './components/layout/CoverOnesLayout';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import Register from './pages/Register';
import VerifyEmailSent from './pages/VerifyEmailSent';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Home from './pages/Home';
import JobBoardPage from './pages/JobBoardPage';
import PostJobPage from './pages/PostJobPage';
import JobDetailPage from './pages/JobDetailPage';
import MyBidsPage from './pages/MyBidsPage';
import MyContractsPage from './pages/MyContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import KycPage from './pages/KycPage';
import ChatRoomPage from './pages/ChatRoomPage';
import Messages from './pages/Messages';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import NotificationsPage from './pages/NotificationsPage';
import SearchPage from './pages/SearchPage';
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
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/verify-sent" element={<VerifyEmailSent />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          {/* OAuth social-login landing (receives tokens in URL fragment) */}
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected app routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CoverOnesLayout />
              </ProtectedRoute>
            }
          >
            {/* / renders Homepage dashboard (P2a) */}
            <Route index element={<Home />} />

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
             * Chat — live as of 2026-06-13, superseding locked decision 2026-06-04.
             * Gateway contract: REST via /api/chat/v1/*; SSE via /api/chat/v1/messages/stream.
             * Identity sourced from authStore (decision 5adf4b20).
             */}
            {/* /messages kept as alias for deep links that still use it */}
            <Route path="messages" element={<Messages />} />
            {/* /chat → room list; /chat/:roomId → conversation */}
            <Route path="chat" element={<Messages />} />
            <Route path="chat/:roomId" element={<ChatRoomPage />} />

            {/* Contacts (gated — no backend yet) */}
            <Route
              path="contacts"
              element={
                <FeatureRoute flag="contacts" feature="聯絡人" description="聯絡人功能正在開發中，敬請期待。">
                  <Contacts />
                </FeatureRoute>
              }
            />

            {/* Notifications */}
            <Route path="notifications" element={<NotificationsPage />} />
            {/* Search — full-site search over real listings; company/people tabs show empty-state */}
            <Route path="search" element={<SearchPage />} />

            {/* Settings — ungated: accessible to all authenticated users */}
            <Route path="settings" element={<Settings />} />

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
