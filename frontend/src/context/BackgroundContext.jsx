import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BackgroundContext = createContext();

export function BackgroundProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const location = useLocation();

  // Allowed pages for the video background
  const allowedPaths = ['/', '/login', '/signup'];
  const isBackgroundPage = allowedPaths.includes(location.pathname);

  // Auto-pause if navigating to other pages
  useEffect(() => {
    if (!isBackgroundPage && isPlaying) {
      setIsPlaying(false);
    }
  }, [location.pathname, isBackgroundPage, isPlaying]);

  const togglePlay = (videoRef) => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <BackgroundContext.Provider value={{ 
      isPlaying, 
      setIsPlaying,
      isMuted, 
      setIsMuted,
      isBackgroundPage,
      togglePlay,
      toggleMute
    }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
