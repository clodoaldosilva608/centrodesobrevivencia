import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Compass, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cardinal, bearing as calcBearing, haversine, formatDistance, type LatLng } from "@/lib/geo";
import { magneticDeclination, applyDeclination } from "@/lib/declination";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  userPosition: LatLng | null;
  target: LatLng | null;
  targetLabel?: string;
}

const CompassHUD = ({ open, onClose, userPosition, target, targetLabel }: Props) => {
  const [heading, setHeading] = useState<number | null>(null);
  const [magnetic, setMagnetic] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const handle = (e: DeviceOrientationEvent) => {
      // iOS webkitCompassHeading (0=N, aumenta CW). Android: alpha (0=N, CCW).
      const iosH = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      let h: number | null = null;
      if (typeof iosH === "number") h = iosH;
      else if (typeof e.alpha === "number") h = 360 - e.alpha;
      if (h != null && !cancelled) setHeading((h + 360) % 360);
    };

    const start = async () => {
      const AnyEvt = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
      try {
        if (typeof AnyEvt.requestPermission === "function") {
          const r = await AnyEvt.requestPermission();
          if (r !== "granted") { setSupported(false); return; }
        }
        window.addEventListener("deviceorientation", handle, true);
      } catch (err) {
        console.warn(err);
        setSupported(false);
      }
    };
    start();

    return () => {
      cancelled = true;
      window.removeEventListener("deviceorientation", handle, true);
    };
  }, [open]);

  if (!open) return null;

  const decl = userPosition ? magneticDeclination(userPosition.lat, userPosition.lng) : 0;
  const trueHeading = heading;
  const displayHeading = trueHeading == null
    ? null
    : magnetic ? applyDeclination(trueHeading, decl) : trueHeading;

  const trueBearingToTarget = userPosition && target ? calcBearing(userPosition, target) : null;
  const displayBearing = trueBearingToTarget == null
    ? null
    : magnetic ? applyDeclination(trueBearingToTarget, decl) : trueBearingToTarget;

  const distanceToTarget = userPosition && target ? haversine(userPosition, target) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute bottom-24 left-4 z-[500] bg-background/95 backdrop-blur border border-border rounded-xl shadow-2xl w-56 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Compass size={16} className="text-primary" /> Bússola
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose} aria-label="Fechar">
          <X size={14} />
        </Button>
      </div>

      <div className="relative aspect-square w-full flex items-center justify-center mb-2">
        <motion.svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          animate={{ rotate: displayHeading == null ? 0 : -displayHeading }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
          <circle cx="50" cy="50" r="42" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.5" />
          {[0, 90, 180, 270].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 50 50)`}>
              <line x1="50" y1="8" x2="50" y2="14" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
            </g>
          ))}
          <polygon points="50,10 46,22 54,22" fill="hsl(var(--destructive))" />
          <text x="50" y="30" textAnchor="middle" fontSize="10" fontWeight="700" fill="hsl(var(--foreground))">N</text>
          <text x="70" y="53" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">L</text>
          <text x="50" y="76" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">S</text>
          <text x="30" y="53" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">O</text>
          {displayBearing != null && (
            <g transform={`rotate(${displayBearing} 50 50)`}>
              <line x1="50" y1="50" x2="50" y2="14" stroke="hsl(var(--primary))" strokeWidth="2" />
              <circle cx="50" cy="14" r="2.5" fill="hsl(var(--primary))" />
            </g>
          )}
        </motion.svg>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Rumo</span>
          <span className="font-mono font-bold">
            {displayHeading == null ? "—" : `${displayHeading.toFixed(0)}° ${cardinal(displayHeading)}`}
          </span>
        </div>
        {target && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1"><MapPin size={11} /> Alvo</span>
              <span className="font-mono">{displayBearing != null ? `${displayBearing.toFixed(0)}°` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distância</span>
              <span className="font-mono">{distanceToTarget != null ? formatDistance(distanceToTarget) : "—"}</span>
            </div>
            {targetLabel && (
              <div className="text-[10px] text-muted-foreground truncate">→ {targetLabel}</div>
            )}
          </>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-border">
          <span className="text-muted-foreground">Magnético</span>
          <Switch checked={magnetic} onCheckedChange={setMagnetic} />
        </div>
        <div className="text-[10px] text-muted-foreground">
          Declinação: {decl >= 0 ? "+" : ""}{decl.toFixed(1)}°
        </div>
        {!supported && (
          <div className="text-[10px] text-destructive">
            Sensor indisponível. Toque para permitir ou use em dispositivo móvel.
          </div>
        )}
        {supported && heading == null && (
          <button
            className="w-full text-[10px] text-primary underline"
            onClick={async () => {
              const AnyEvt = DeviceOrientationEvent as unknown as {
                requestPermission?: () => Promise<"granted" | "denied">;
              };
              if (typeof AnyEvt.requestPermission === "function") {
                const r = await AnyEvt.requestPermission();
                if (r !== "granted") toast.error("Permissão negada");
              }
            }}
          >
            Ativar sensor de orientação
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default CompassHUD;
