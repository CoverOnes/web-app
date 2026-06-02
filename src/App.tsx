import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query';
import CoverOnesLayout from './components/layout/CoverOnesLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import JobBoardPage from './pages/JobBoardPage';
import PostJobPage from './pages/PostJobPage';
import JobDetailPage from './pages/JobDetailPage';
import MyBidsPage from './pages/MyBidsPage';
import MyContractsPage from './pages/MyContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import Messages from './pages/Messages';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
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

            {/* Contracts */}
            <Route path="contracts" element={<MyContractsPage />} />
            <Route path="contracts/:id" element={<ContractDetailPage />} />

            {/* Parked: chat + legacy */}
            <Route path="messages" element={<Messages />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="settings" element={<Settings />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/jobs" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
