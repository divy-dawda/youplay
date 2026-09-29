import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
} from 'lucide-react';
import { formatDuration } from '../../utils/format';

export default function VideoPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const progressRef = useRef(null);
  const volumeRef = useRef(null);
  const isDraggingProgress = useRef(false);
  const isDraggingVolume = useRef(false);

  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Time update
  const handleTimeUpdate = () => {
    if (videoRef.current && !isDraggingProgress.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  // Seek pointer handlers
  const updateProgressFromEvent = (clientX) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleProgressPointerDown = (e) => {
    isDraggingProgress.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateProgressFromEvent(e.clientX);
  };

  const handleProgressPointerMove = (e) => {
    if (isDraggingProgress.current) {
      updateProgressFromEvent(e.clientX);
    }
  };

  const handleProgressPointerUp = (e) => {
    isDraggingProgress.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignored
    }
  };

  // Volume pointer handlers
  const updateVolumeFromEvent = (clientX) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setVolume(pos);
    if (videoRef.current) {
      videoRef.current.volume = pos;
      videoRef.current.muted = pos === 0;
      setIsMuted(pos === 0);
    }
  };

  const handleVolumePointerDown = (e) => {
    isDraggingVolume.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateVolumeFromEvent(e.clientX);
  };

  const handleVolumePointerMove = (e) => {
    if (isDraggingVolume.current) {
      updateVolumeFromEvent(e.clientX);
    }
  };

  const handleVolumePointerUp = (e) => {
    isDraggingVolume.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignored
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      const targetVol = volume > 0 ? volume : 0.5;
      videoRef.current.volume = targetVol;
      setVolume(targetVol);
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isDraggingProgress.current && !isDraggingVolume.current) {
        setShowControls(false);
      }
    }, 2500);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) {
          const newTime = Math.min(videoRef.current.duration || 100, videoRef.current.currentTime + 5);
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) {
          const newTime = Math.max(0, videoRef.current.currentTime - 5);
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newVol = Math.min(1, volume + 0.05);
        setVolume(newVol);
        if (videoRef.current) {
          videoRef.current.volume = newVol;
          videoRef.current.muted = false;
          setIsMuted(false);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newVol = Math.max(0, volume - 0.05);
        setVolume(newVol);
        if (videoRef.current) {
          videoRef.current.volume = newVol;
          videoRef.current.muted = newVol === 0;
          setIsMuted(newVol === 0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group select-none shadow-2xl border border-slate-800/80"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Big center play icon if paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm hover:scale-110 active:scale-95 transition-all"
        >
          <Play className="w-8 h-8 fill-white translate-x-0.5" />
        </button>
      )}

      {/* Control Bar Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-linear-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* YouTube-style Progress bar with red line behind the circle */}
        <div
          ref={progressRef}
          onPointerDown={handleProgressPointerDown}
          onPointerMove={handleProgressPointerMove}
          onPointerUp={handleProgressPointerUp}
          onPointerCancel={handleProgressPointerUp}
          className="relative w-full h-4 flex items-center cursor-pointer select-none group/progress mb-2 py-1"
          role="slider"
          aria-label="Seek progress"
          aria-valuemin="0"
          aria-valuemax={duration || 100}
          aria-valuenow={currentTime}
          tabIndex={0}
        >
          {/* Base track */}
          <div className="w-full h-1 group-hover/progress:h-1.5 bg-slate-700/80 rounded-full overflow-hidden transition-all duration-150">
            {/* Red progress fill behind the circle */}
            <div
              className="h-full bg-red-600 rounded-full transition-none"
              style={{ width: `${duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%` }}
            />
          </div>

          {/* Red scrubber circle (thumb) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-red-600 rounded-full shadow-md transition-transform duration-150 group-hover/progress:scale-125 pointer-events-none"
            style={{ left: `${duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-white text-xs sm:text-sm">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              {/* YouTube-style Volume Slider with red line behind the circle */}
              <div
                ref={volumeRef}
                onPointerDown={handleVolumePointerDown}
                onPointerMove={handleVolumePointerMove}
                onPointerUp={handleVolumePointerUp}
                onPointerCancel={handleVolumePointerUp}
                className="relative w-16 sm:w-20 h-5 flex items-center cursor-pointer select-none group/volume-slider hidden sm:flex py-1.5"
                role="slider"
                aria-label="Volume slider"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
                tabIndex={0}
              >
                {/* Base track */}
                <div className="w-full h-1 group-hover/volume-slider:h-1.5 bg-slate-700/80 rounded-full overflow-hidden transition-all duration-150">
                  {/* Red progress line behind the circle */}
                  <div
                    className="h-full bg-red-600 rounded-full transition-none"
                    style={{ width: `${isMuted ? 0 : Math.min(100, Math.max(0, volume * 100))}%` }}
                  />
                </div>

                {/* Red volume circle thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-red-600 rounded-full shadow-md transition-transform duration-150 group-hover/volume-slider:scale-125 pointer-events-none"
                  style={{ left: `${isMuted ? 0 : Math.min(100, Math.max(0, volume * 100))}%` }}
                />
              </div>
            </div>

            {/* Time display */}
            <div className="text-xs font-mono text-slate-300">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
