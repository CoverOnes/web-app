import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query';
import CoverOnesLayout from './components/layout/CoverOnesLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { FeatureRoute } from './features/flags/FeatureRoute';
import { useTheme } from './hooks/useTheme';
import './App.css';

// ---------------------------------------------------------------------------
// Route-level code splitting: every page is a separate async chunk.
// Suspense fallback uses the --co-bg shimmer skeleton.
// ---------------------------------------------------------------------------
const Login = lazy(() => import('./pages/Login'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmailSent = lazy(() => import('./pages/VerifyEmailSent'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const WaitlistPage = lazy(() => import('./pages/WaitlistPage'));

const Home = lazy(() => import('./pages/Home'));
const JobBoardPage = lazy(() => import('./pages/JobBoardPage'));
const PostJobPage = lazy(() => import('./pages/PostJobPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const MyBidsPage = lazy(() => import('./pages/MyBidsPage'));
const MyContractsPage = lazy(() => import('./pages/MyContractsPage'));
const ContractDetailPage = lazy(() => import('./pages/ContractDetailPage'));
const KycPage = lazy(() => import('./pages/KycPage'));
const ChatRoomPage = lazy(() => import('./pages/ChatRoomPage'));
const Messages = lazy(() => import('./pages/Messages'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Settings = lazy(() => import('./pages/Settings'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const NetworkPage = lazy(() => import('./pages/NetworkPage'));
const MyCompanyPage = lazy(() => import('./pages/MyCompanyPage'));
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const LiveDirectoryPage = lazy(() => import('./pages/LiveDirectoryPage'));
const LiveViewerPage = lazy(() => import('./pages/LiveViewerPage'));
const LiveHostPage = lazy(() => import('./pages/LiveHostPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));

// ---------------------------------------------------------------------------
// Shimmer skeleton fallback — dark bg + animated shimmer bar.
// Used as Suspense fallback for all route transitions.
// ---------------------------------------------------------------------------
function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="頁面載入中"
      style={{
        minHeight: '100vh',
        background: 'var(--co-bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '80px 28px 28px',
        boxSizing: 'border-box',
      }}
    >
      {/* Shimmer bars */}
      {[240, 180, 320, 140, 280].map((w, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            height: 16,
            maxWidth: w,
            borderRadius: 8,
            background: `linear-gradient(
              90deg,
              var(--co-bg-card) 0%,
              var(--co-bg-card-2) 50%,
              var(--co-bg-card) 100%
            )`,
            backgroundSize: '200% 100%',
            animation: `shimmer 1.4s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function App() {
  useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public routes (no auth required) */}
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/verify-sent" element={<VerifyEmailSent />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Public utility pages — accessible without auth */}
            <Route path="/help" element={<HelpPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />

            {/* Protected app routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <CoverOnesLayout />
                </ProtectedRoute>
              }
            >
              {/* / renders Homepage dashboard */}
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

              {/* Discover — company explorer */}
              <Route path="discover" element={<DiscoverPage />} />

              {/* Pricing — subscription plans comparison; no billing API (payments flag=false) */}
              <Route path="pricing" element={<PricingPage />} />

              {/* Network (P4) */}
              <Route path="network" element={<NetworkPage />} />

              {/* Company (P4) */}
              <Route path="company" element={<MyCompanyPage />} />
              <Route path="companies/:companyId" element={<CompanyProfilePage />} />

              {/* Reports + Insights (P4) */}
              <Route path="reports" element={<ReportsPage />} />
              <Route path="insights" element={<InsightsPage />} />

              {/* Saved (P4) */}
              <Route path="saved" element={<SavedPage />} />

              {/* Search */}
              <Route path="search" element={<SearchPage />} />

              {/*
               * Avatar Livestream scaffold (issue #50) — /live, /live/host, /live/:roomId
               * IMPORTANT: /live/host MUST come before /live/:roomId so the router matches it first.
               */}
              <Route
                path="live"
                element={
                  <FeatureRoute flag="avatarLive" feature="替身直播" description="替身直播台功能正在開發中，敬請期待。">
                    <LiveDirectoryPage />
                  </FeatureRoute>
                }
              />
              <Route
                path="live/host"
                element={
                  <FeatureRoute flag="avatarLive" feature="替身直播" description="替身直播台功能正在開發中，敬請期待。">
                    <LiveHostPage />
                  </FeatureRoute>
                }
              />
              <Route
                path="live/:roomId"
                element={
                  <FeatureRoute flag="avatarLive" feature="替身直播" description="替身直播台功能正在開發中，敬請期待。">
                    <LiveViewerPage />
                  </FeatureRoute>
                }
              />

              {/* Settings */}
              <Route path="settings" element={<Settings />} />

              {/* Profile (P4) */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/:userId" element={<ProfilePage />} />

              {/* 404 within the app shell — catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Top-level catch-all: render 404 page (not Navigate redirect) */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
