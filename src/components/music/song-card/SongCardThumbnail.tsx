/**
 * SongCard Thumbnail Component
 * Sprint CAT-AUDIT-P2 - Refatoração SongCard
 * Sprint CAT-AUDIT-P3 - Alt text descritivo + ARIA
 */

import { useState } from 'react';
import { Music, Play } from 'lucide-react';
import { extractYoutubeVideoId } from './types';

interface SongCardThumbnailProps {
  title: string;
  artistName?: string;
  youtubeUrl?: string | null;
  thumbnail?: string;
  isCompact?: boolean;
  onTogglePlayer?: () => void;
}

export function SongCardThumbnail({
  title,
  artistName,
  youtubeUrl,
  thumbnail,
  isCompact = false,
  onTogglePlayer
}: SongCardThumbnailProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  
  const videoId = youtubeUrl ? extractYoutubeVideoId(youtubeUrl) : null;
  
  const thumbnailUrl = videoId && !thumbnailError
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : thumbnail || null;

  const handleClick = () => {
    if (!isCompact && videoId && onTogglePlayer) {
      onTogglePlayer();
    }
  };

  // Alt text descritivo para acessibilidade
  const altText = artistName 
    ? `Thumbnail do vídeo para ${title} de ${artistName}`
    : `Thumbnail do vídeo para ${title}`;

  const isClickable = !isCompact && videoId;

  return (
    <div 
      className={`${isCompact ? 'w-32 h-32' : 'w-32 h-32 md:w-48 md:h-48'} bg-muted flex items-center justify-center relative overflow-hidden rounded-lg group ${isClickable ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `Reproduzir vídeo de ${title}` : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={altText}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setThumbnailError(true)}
        />
      ) : (
        <Music 
          className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" 
          role="img"
          aria-label={`Ícone musical para ${title}`}
        />
      )}
      
      {/* Hover Overlay with Play Icon - Full mode only */}
      {!isCompact && videoId && (
        <div 
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          aria-hidden="true"
        >
          <Play className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
      )}
    </div>
  );
}
