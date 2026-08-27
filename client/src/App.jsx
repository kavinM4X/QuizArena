import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PlayerProvider } from './context/PlayerContext';
import { SocketProvider } from './context/SocketContext';
import LoadingSpinner from './components/LoadingSpinner';

const Landing = lazy(() => import('./pages/Landing'));
const Join = lazy(() => import('./pages/Join'));
const WaitingRoom = lazy(() => import('./pages/WaitingRoom'));
const Play = lazy(() => import('./pages/Play'));
const Result = lazy(() => import('./pages/Result'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <PlayerProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
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
              <Route path="/" element={<Landing />} />
              <Route path="/join" element={<Join />} />
              <Route path="/waiting/:quizCode" element={<WaitingRoom />} />
              <Route path="/play/:quizCode" element={<Play />} />
              <Route path="/result/:quizCode" element={<Result />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SocketProvider>
    </PlayerProvider>
  );
}

export default App;
