import { MapPin, Plane, Cloud } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

interface ShipmentMapProps {
  originCity?: string | null;
  originCountry?: string | null;
  destCity?: string | null;
  destCountry?: string | null;
  progress: number;
  contents?: string | null;
}

interface CloudData {
  id: number;
  top: string;
  scale: number;
  duration: string;
  delay: string;
  opacity: number;
  zIndex: string;
}

export function ShipmentMap({
  originCity,
  originCountry,
  destCity,
  destCountry,
  progress,
  contents,
}: ShipmentMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Generate stable cloud data
  const clouds = useMemo(() => {
    const cloudArray: CloudData[] = [];
    for (let i = 0; i < 8; i++) {
      cloudArray.push({
        id: i,
        top: `${10 + Math.random() * 70}%`,
        scale: 0.5 + Math.random() * 1.5,
        duration: `${25 + Math.random() * 35}s`,
        delay: `${-Math.random() * 60}s`,
        opacity: 0.15 + Math.random() * 0.35,
        zIndex: i % 2 === 0 ? "z-10" : "z-30", // some below plane (z-20), some above
      });
    }
    return cloudArray;
  }, []);

  // Simple coordinate mapping for a stylized map
  // In a real app, we'd use geocoding. Here we use deterministic positions based on names
  const getCoords = (name: string | null | undefined, isOrigin: boolean) => {
    if (!name) return isOrigin ? { x: 20, y: 50 } : { x: 80, y: 50 };

    // Hash the name to get somewhat stable "random" coordinates for the mockup
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const x = isOrigin ? 10 + (Math.abs(hash) % 30) : 60 + (Math.abs(hash) % 30);
    const y = 20 + Math.abs(hash % 60);
    return { x, y };
  };

  const origin = getCoords(originCountry || originCity, true);
  const dest = getCoords(destCountry || destCity, false);

  // Calculate icon position along the path
  const currentX = origin.x + (dest.x - origin.x) * (progress / 100);
  const currentY = origin.y + (dest.y - origin.y) * (progress / 100);

  // Rotation of the plane icon
  const angle = Math.atan2(dest.y - origin.y, dest.x - origin.x) * (180 / Math.PI);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-white/10 bg-navy/50 backdrop-blur-sm">
      <svg viewBox="0 0 100 100" className="h-full w-full opacity-20" preserveAspectRatio="none">
        {/* Simple stylized world map grid/dots */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="currentColor" className="text-white/20" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
      </svg>

      {/* Background Clouds */}
      {clouds
        .filter((c) => c.zIndex === "z-10")
        .map((cloud) => (
          <div
            key={cloud.id}
            className={`absolute animate-cloud-drift pointer-events-none ${cloud.zIndex}`}
            style={{
              top: cloud.top,
              animationDuration: cloud.duration,
              animationDelay: cloud.delay,
              opacity: cloud.opacity,
            }}
          >
            <div style={{ transform: `scale(${cloud.scale})` }}>
              <Cloud className="text-white fill-white blur-[1px]" size={48} />
            </div>
          </div>
        ))}

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full z-20"
        preserveAspectRatio="none"
      >
        {/* Connection path */}
        <path
          d={`M ${origin.x} ${origin.y} Q ${(origin.x + dest.x) / 2} ${
            Math.min(origin.y, dest.y) - 20
          } ${dest.x} ${dest.y}`}
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          className="opacity-30"
        />

        {/* Animated progress path */}
        <path
          d={`M ${origin.x} ${origin.y} Q ${(origin.x + dest.x) / 2} ${
            Math.min(origin.y, dest.y) - 20
          } ${dest.x} ${dest.y}`}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="1"
          strokeDasharray="100"
          strokeDashoffset={100 - progress}
          className="transition-all duration-1000"
        />

        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
      </svg>

      {/* Origin Marker */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 z-20"
        style={{ left: `${origin.x}%`, top: `${origin.y}%` }}
      >
        <MapPin className="h-4 w-4 text-white" />
        <span className="whitespace-nowrap text-[10px] font-bold text-white shadow-sm">
          {originCity || originCountry}
        </span>
      </div>

      {/* Destination Marker */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 z-20"
        style={{ left: `${dest.x}%`, top: `${dest.y}%` }}
      >
        <MapPin className="h-4 w-4 text-pme-red" />
        <span className="whitespace-nowrap text-[10px] font-bold text-white shadow-sm">
          {destCity || destCountry}
        </span>
      </div>

      {/* Moving Plane Icon & Label */}
      {progress > 0 && progress < 100 && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 z-20"
          style={{
            left: `${currentX}%`,
            top: `${currentY - 5}%`, // slightly offset for the curve
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {contents && (
              <div className="whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-bold text-navy shadow-sm backdrop-blur-sm">
                {contents}
              </div>
            )}
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full bg-pme-red text-white shadow-lg shadow-pme-red/50"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <Plane className="h-3 w-3 fill-current" />
            </div>
          </div>
        </div>
      )}

      {/* Foreground Clouds */}
      {clouds
        .filter((c) => c.zIndex === "z-30")
        .map((cloud) => (
          <div
            key={cloud.id}
            className={`absolute animate-cloud-drift pointer-events-none ${cloud.zIndex}`}
            style={{
              top: cloud.top,
              animationDuration: cloud.duration,
              animationDelay: cloud.delay,
              opacity: cloud.opacity,
            }}
          >
            <div style={{ transform: `scale(${cloud.scale})` }}>
              <Cloud className="text-white fill-white blur-[2px]" size={48} />
            </div>
          </div>
        ))}

      {/* Overlay Status */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-navy/80 px-3 py-1.5 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-pme-red" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/80">
            Live Journey Status
          </span>
        </div>
        <div className="text-[10px] font-bold text-white">{progress}% Complete</div>
      </div>
    </div>
  );
}
