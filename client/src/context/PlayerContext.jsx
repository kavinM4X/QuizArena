import { createContext, useContext, useState } from 'react';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const [player, setPlayer] = useState(() => {
    try {
      const s = sessionStorage.getItem('qa_player');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const savePlayer = (data) => {
    sessionStorage.setItem('qa_player', JSON.stringify(data));
    setPlayer(data);
  };

  const clearPlayer = () => {
    sessionStorage.removeItem('qa_player');
    setPlayer(null);
  };

  return (
    <PlayerContext.Provider value={{ player, savePlayer, clearPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};
