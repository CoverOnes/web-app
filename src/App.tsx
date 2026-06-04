import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query';
import CoverOnesLayout from './components/layout/CoverOnesLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmailSent from './pages/VerifyEmailSent';
import VerifyEmail from './pages/VerifyEmail';
import JobBoardPage from './pages/JobBoardPage';
import PostJobPage from './pages/PostJobPage';
import JobDetailPage from './pages/JobDetailPage';
import MyBidsPage from './pages/MyBidsPage';
import MyContractsPage from './pages/MyContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import KycPage from './pages/KycPage';
import Messages from './pages/Messages';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
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
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* auth Increment 1: post-register "check your email" screen */}
          <Route path="/register/verify-sent" element={<VerifyEmailSent />} />
          {/* auth Increment 1: email verification deep link (?token=...) */}
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CoverOnesLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/jobs" replace />} />

            {/* Marketplace */}
            <Route path="jobs" element={<JobBoardPage />} />
            <Route path="jobs/new" element={<PostJobPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />

            {/* Bids */}
            <Route path="bids" element={<MyBidsPage />} />

            {/* KYC onboarding (Increment 2) — climb to tier-2 to unlock 發案/投標 */}
            <Route path="kyc" element={<KycPage />} />

            {/* Contracts */}
            <Route path="contracts" element={<MyContractsPage />} />
            <Route path="contracts/:id" element={<ContractDetailPage />} />

            {/* TBD: gated behind feature flags until the backend ships.
                Components are preserved — only the route target is swapped to a
                ComingSoon placeholder so a user cannot reach a screen that calls
                a non-existent API and crashes. */}
            <Route
              path="messages"
              element={
                <FeatureRoute flag="chat" feature="聊天" description="即時通訊功能正在開發中，敬請期待。">
                  <Messages />
                </FeatureRoute>
              }
            />
            <Route
              path="contacts"
              element={
                <FeatureRoute flag="contacts" feature="聯絡人" description="聯絡人功能正在開發中，敬請期待。">
                  <Contacts />
                </FeatureRoute>
              }
            />
            <Route
              path="settings"
              element={
                <FeatureRoute flag="avatarSettings" feature="設定" description="個人設定功能正在開發中，敬請期待。">
                  <Settings />
                </FeatureRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/jobs" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
