import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Heart, Bookmark, ExternalLink, Play, Volume2, VolumeX } from 'lucide-react';
import type { Product } from '../types/types';
import type { ShowroomStyle } from '../types/showroom-types';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui';

interface PinterestGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  showroomStyles?: ShowroomStyle[];
}

type CardSize = 'normal' | 'tall' | 'wide' | 'large';

// Local product videos and matching thumbnails
const VIDEO_ASSETS = [
  { image: '/videos/Vid_AER-AE-SK-01.jpg', video: '/videos/Vid_AER-AE-SK-01.mp4' },
  { image: '/videos/Vid_AER-AE-TR-01.jpg', video: '/videos/Vid_AER-AE-TR-01.mp4' },
  { image: '/videos/Vid_AER-AE-DR-01.jpg', video: '/videos/Vid_AER-AE-DR-01.mp4' },
  { image: '/videos/Vid_AER-AE-DR-02.jpg', video: '/videos/Vid_AER-AE-DR-02.mp4' },
  { image: '/videos/Vid_AER-AE-TP-01.jpg', video: '/videos/Vid_AER-AE-TP-01.mp4' },
  { image: '/videos/Vid_AER-AE-SH-01.jpg', video: '/videos/Vid_AER-AE-SH-01.mp4' },
];

export function PinterestGrid({ products, onProductClick, showroomStyles }: PinterestGridProps) {
  // Build a lookup map for ShowroomStyle by product ID
  const styleMap = useMemo(() => {
    if (!showroomStyles) return null;
    const map = new Map<string, ShowroomStyle>();
    showroomStyles.forEach((s) => map.set(s.product.id, s));
    return map;
  }, [showroomStyles]);

  // Assign sizes and video properties to products, with video cards at top
  const productsWithProps = useMemo(() => {
    const sizePattern: CardSize[] = [
      'normal', 'tall', 'normal', 'wide', 'normal',
      'normal', 'tall', 'normal', 'normal', 'large',
      'tall', 'normal', 'normal', 'wide', 'normal',
      'normal', 'normal', 'tall', 'normal', 'normal'
    ];

    // First pass: assign video assets to first N products (where N = number of video assets)
    const videoCount = 0;

    const mapped = products.map((product, index) => {
      const size: CardSize = sizePattern[index % sizePattern.length] ?? 'normal';
      // Assign video assets to first 6 products (top of grid)
      const hasVideo = index < videoCount;
      const videoAsset = hasVideo ? VIDEO_ASSETS[index] : null;
      const videoUrl: string | null = videoAsset?.video ?? null;
      const thumbnailImage: string | null = videoAsset?.image ?? null;
      // Auto-play video for first 2 products
      const autoPlayVideo = hasVideo && index < 2;

      return { product, size, videoUrl, thumbnailImage, autoPlayVideo };
    });

    // Sort: video cards first, then rest
    return mapped.sort((a, b) => {
      if (a.videoUrl && !b.videoUrl) return -1;
      if (!a.videoUrl && b.videoUrl) return 1;
      return 0;
    });
  }, [products]);

  if (productsWithProps.length === 0) {
    return <EmptyState description="No products to display" />;
  }

  return (
    // eslint-disable-next-line design-system/prefer-metric-grid -- Pinterest-style masonry product grid
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 auto-rows-[10px]">
      {productsWithProps.map(({ product, size, videoUrl, thumbnailImage, autoPlayVideo }, index) => (
        <PinterestCard
          key={product.id}
          product={product}
          onClick={() => onProductClick(product)}
          index={index}
          size={size}
          videoUrl={videoUrl}
          thumbnailImage={thumbnailImage}
          autoPlayVideo={autoPlayVideo}
          showroomStyle={styleMap?.get(product.id)}
        />
      ))}
    </div>
  );
}

interface PinterestCardProps {
  product: Product;
  onClick: () => void;
  index: number;
  size: CardSize;
  videoUrl: string | null;
  thumbnailImage: string | null;
  autoPlayVideo: boolean;
  showroomStyle?: ShowroomStyle;
}

function PinterestCard({ product, onClick, size, videoUrl, thumbnailImage, autoPlayVideo }: PinterestCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video play/pause on hover (first 2 always play)
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    if (autoPlayVideo) {
      // Always play for auto-play videos
      videoRef.current.play().catch(() => {
        // Auto-play might be blocked by browser
      });
    } else if (isHovered) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered, videoUrl, autoPlayVideo]);

  // Keep auto-play videos always playing
  useEffect(() => {
    if (!videoRef.current || !autoPlayVideo) return;

    const video = videoRef.current;
    const handlePause = () => {
      // If video pauses for any reason, restart it
      video.play().catch(() => {});
    };

    video.addEventListener('pause', handlePause);
    return () => video.removeEventListener('pause', handlePause);
  }, [autoPlayVideo]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  }, [isLiked]);

  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  }, [isSaved]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  // Grid span classes based on size
  const sizeClasses = {
    normal: 'col-span-1 row-span-[25]',
    tall: 'col-span-1 row-span-[35]',
    wide: 'col-span-2 row-span-[25]',
    large: 'col-span-2 row-span-[35]',
  };

  const showVideo = videoUrl && (isHovered || autoPlayVideo);

  // Don't render card if image failed to load and no video
  if (imageError && !videoUrl) {
    return null;
  }

  return (
    <div
      className={cn(
        'group cursor-pointer',
        'transition-all duration-300 ease-out',
        sizeClasses[size],
        isHovered ? 'z-20 scale-[1.02]' : ''
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={cn(
          'relative h-full bg-white rounded-lg overflow-hidden border border-gray-200',
          'shadow-sm transition-all duration-200',
          isHovered ? 'shadow-md border-primary/30' : '',
          autoPlayVideo ? 'ring-2 ring-primary/30' : ''
        )}
      >
        {/* Image - use thumbnailImage if available, otherwise product.primaryImage */}
        <div className="absolute inset-0">
          {!imageError ? (
            <img
              src={thumbnailImage || product.primaryImage}
              alt={product.name}
              className={cn(
                'w-full h-full object-cover transition-all duration-500 ease-out',
                isHovered && !videoUrl ? 'scale-105' : 'scale-100',
                imageLoaded ? 'opacity-100' : 'opacity-0',
                showVideo && videoLoaded ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : null}

          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 animate-pulse bg-gray-200" />
          )}
        </div>

        {/* Video overlay */}
        {videoUrl && (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- decorative video preview, no audio content
          <video
            ref={videoRef}
            src={videoUrl}
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
              showVideo && videoLoaded ? 'opacity-100' : 'opacity-0'
            )}
            muted={isMuted}
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
          />
        )}

        {/* Video indicator */}
        {videoUrl && !showVideo && (
          <div className="absolute top-3 right-3 p-2 rounded-full bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm">
            <Play className="w-4 h-4" fill="currentColor" />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent',
            'transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3 pt-8">
          <h3 className="text-white text-sm font-medium line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Action buttons - top right */}
        <div
          className={cn(
            'absolute top-3 right-3 flex gap-2',
            'transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
            videoUrl && !showVideo ? 'hidden' : ''
          )}
        >
          {/* Mute/Unmute button for videos */}
          {showVideo && (
            <button
              onClick={handleMuteToggle}
              className={cn(
                'p-2 rounded-full transition-all duration-200 shadow-lg',
                'bg-white/95 text-gray-700 hover:bg-white hover:scale-110'
              )}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={handleSave}
            className={cn(
              'p-2 rounded-full transition-all duration-200 shadow-lg',
              isSaved
                ? 'bg-primary text-white'
                : 'bg-white/95 text-gray-700 hover:bg-white hover:scale-110'
            )}
            aria-label={isSaved ? 'Unsave' : 'Save'}
          >
            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-full bg-white/95 text-gray-700 hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
            aria-label="Open"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Like button - bottom left on hover */}
        <div
          className={cn(
            'absolute bottom-16 left-3',
            'transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
        >
          <button
            onClick={handleLike}
            className={cn(
              'p-2 rounded-full transition-all duration-200 shadow-lg',
              isLiked
                ? 'bg-red-500 text-white'
                : 'bg-white/95 text-gray-700 hover:bg-white hover:scale-110'
            )}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Color swatches on hover */}
        <div
          className={cn(
            'absolute bottom-16 right-3',
            'transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
        >
          <div className="flex gap-1">
            {product.colors.slice(0, 4).map((color, idx) => (
               
              <div
                key={idx}
                className="w-5 h-5 rounded-full border-2 border-white shadow-md"
                // eslint-disable-next-line no-restricted-syntax -- dynamic color
                style={{ backgroundColor: color }}
              />
            ))}
            {product.colors.length > 4 && (
              <div className="w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center border-2 border-white shadow-md">
                +{product.colors.length - 4}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
