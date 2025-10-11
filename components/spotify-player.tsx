"use client";

import { useEffect } from "react";

interface SpotifyPlayerProps {
  artistId: string;
}

export function SpotifyPlayer({ artistId }: SpotifyPlayerProps) {
  const embedUrl = `https://open.spotify.com/embed/artist/${artistId}?utm_source=generator&theme=0`;
  
  useEffect(() => {
    console.log('[Spotify Player] Mounted with artist ID:', artistId);
    console.log('[Spotify Player] Embed URL:', embedUrl);
    
    return () => {
      console.log('[Spotify Player] UNMOUNTING - this should NOT happen while in fullscreen');
    };
  }, [artistId, embedUrl]);
  
  return (
    <div 
      className="fixed bottom-4 right-4 z-[100] shadow-2xl rounded-xl overflow-hidden"
      style={{
        width: '300px',
        height: '380px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        console.log('[Spotify Player] Click intercepted and stopped');
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
      }}
    >
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{
          borderRadius: '12px'
        }}
      />
    </div>
  );
}

