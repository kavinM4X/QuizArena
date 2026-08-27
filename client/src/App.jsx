import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PlayerProvider } from './context/PlayerContext';
import { SocketProvider } from './context/SocketContext';

import Landing    from './pages/Landing';
import Join       from './pages/Join';
import WaitingRoom from './pages/WaitingRoom';
import Play       from './pages/Play';
import Result     from './pages/Result';
import NotFound   from './pages/NotFound';

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
          <Routes>
            <Route path="/"                   element={<Landing />} />
            <Route path="/join"               element={<Join />} />
            <Route path="/waiting/:quizCode"  element={<WaitingRoom />} />
            <Route path="/play/:quizCode"     element={<Play />} />
            <Route path="/result/:quizCode"   element={<Result />} />
            <Route path="*"                   element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </PlayerProvider>
  );
}

export default App;
