import { useRef } from 'react';
import { Box, IconButton, Stack } from '@mui/material';
import bgVideo from '../assets/Bg Speedometer.mkv';
import bgImage from '../assets/bg.jpeg';
import VolumeUp from '@mui/icons-material/VolumeUp';
import VolumeOff from '@mui/icons-material/VolumeOff';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import { useBackground } from '../context/BackgroundContext';

export default function BackgroundMedia() {
  const { isPlaying, isMuted, setIsMuted, isBackgroundPage, togglePlay } = useBackground();
  const videoRef = useRef(null);

  return (
    <>
      {/* Background Media Container */}
      <Box 
        sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: -2,
          opacity: isBackgroundPage ? 1 : 0,
          visibility: isBackgroundPage ? 'visible' : 'hidden',
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        {/* Fallback Image - Visible when paused */}
        <Box
          component="img"
          src={bgImage}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isPlaying ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out',
            zIndex: isPlaying ? -1 : 1,
          }}
        />

        {/* Background Video */}
        <Box
          component="video"
          ref={videoRef}
          loop
          muted={isMuted}
          playsInline
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
          }}
        >
          <source src={bgVideo} type="video/webm" />
          <source src={bgVideo} type="video/mp4" />
          <source src={bgVideo} />
        </Box>

        {/* Common Overlays (Matched to original Image filters) */}
        {/* Dark Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        {/* Glossy Sheen Overlay */}
        <Box 
          sx={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.1) 100%)', 
            borderBottom: '1px solid rgba(255, 255, 254, 0.08)',
            zIndex: 2,
            pointerEvents: 'none',
          }} 
        />
      </Box>

      {/* Media Controls - Fixed Bottom Left */}
      {isBackgroundPage && (
        <Stack 
          direction="column" 
          spacing={1} 
          sx={{ 
            position: 'fixed', 
            bottom: 5, 
            left: 5, 
            zIndex: (theme) => theme.zIndex.drawer + 2,
            animation: 'heroFadeUp 0.55s ease-out 0.8s forwards',
            opacity: 0,
            '@keyframes heroFadeUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } }
          }}
        >
          <IconButton
            onClick={() => togglePlay(videoRef)}
            size="small"
            sx={{
              color: '#6d7486c2',
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' },
              width: 20,
              height: 20,
            }}
          >
            {isPlaying ? <Pause fontSize="x-small" /> : <PlayArrow fontSize="x-small" />}
          </IconButton>
          
          <IconButton
            onClick={() => setIsMuted(!isMuted)}
            size="small"
            sx={{
              color: '#6d7486c2',
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' },
              width: 20,
              height: 20,
            }}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeOff fontSize="x-small" /> : <VolumeUp fontSize="x-small" />}
          </IconButton>
        </Stack>
      )}
    </>
  );
}
