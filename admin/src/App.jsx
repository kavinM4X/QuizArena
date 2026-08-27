import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateQuiz = lazy(() => import('./pages/CreateQuiz'));
const LiveControl = lazy(() => import('./pages/LiveControl'));
const Results = lazy(() => import('./pages/Results'));
const History = lazy(() => import('./pages/History'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1C2740',
                color: '#F1F4FA',
                border: '1px solid #263252',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
            }}
          />

          <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1322' }}>
              <LoadingSpinner size={36} />
            </div>
          }>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected — require admin JWT */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/create-quiz" element={<CreateQuiz />} />
                <Route path="/live/:quizCode" element={<LiveControl />} />
                <Route path="/results/:quizCode" element={<Results />} />
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
