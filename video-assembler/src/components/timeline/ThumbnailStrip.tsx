import React from 'react';

interface ThumbnailStripProps {
  thumbnails: string[],
  duration: number,
  width: number,
}

export const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({
  thumbnails,
  duration,
  width,
}) => {
  const THUMBNAIL_HEIGHT = 40;
  const thumbnailWidth = Math.max(THUMBNAIL_HEIGHT * (16/9), width / thumbnails.length);

  return (
    <div 
      className="absolute inset-0 flex overflow-hidden"
      style={{ height: `${THUMBNAIL_HEIGHT}px` }}
    >
      {thumbnails.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="flex-shrink-0"
          style={{
            width: `${thumbnailWidth}px`,
            height: `${THUMBNAIL_HEIGHT}px`,
          }}
        >
          <img
            src={url}
            alt={`Thumbnail ${index}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};
