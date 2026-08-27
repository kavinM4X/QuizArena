import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import CreateQuiz  from './pages/CreateQuiz';
import LiveControl from './pages/LiveControl';
import Results     from './pages/Results';
import History     from './pages/History';
import NotFound    from './pages/NotFound';

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

          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected — require admin JWT */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard"         element={<Dashboard />} />
              <Route path="/history"           element={<History />} />
              <Route path="/create-quiz"        element={<CreateQuiz />} />
              <Route path="/live/:quizCode"     element={<LiveControl />} />
              <Route path="/results/:quizCode"  element={<Results />} />
            </Route>

            {/* Redirects */}
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
