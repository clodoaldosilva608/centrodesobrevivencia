import { useState } from "react";
import { useMapEvents } from "react-leaflet";
import { toDD, toDMS, toMGRS } from "@/lib/mgrs";
import { Copy } from "lucide-react";
import { toast } from "sonner";

type Fmt = "DD" | "DMS" | "MGRS";

const CoordinateReadout = () => {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [fmt, setFmt] = useState<Fmt>("DD");

  useMapEvents({
    move: (e) => {
      const c = e.target.getCenter();
      setCenter({ lat: c.lat, lng: c.lng });
    },
    load: (e) => {
      const c = e.target.getCenter();
      setCenter({ lat: c.lat, lng: c.lng });
    },
  });

  const text = center
    ? fmt === "DD"
      ? toDD(center.lat, center.lng)
      : fmt === "DMS"
        ? toDMS(center.lat, center.lng)
        : toMGRS(center.lat, center.lng)
    : "—";

  const copy = () => {
    navigator.clipboard?.writeText(text);
    toast.success("Coordenada copiada");
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 max-w-[95vw]">
      <div className="flex gap-1">
        {(["DD", "DMS", "MGRS"] as Fmt[]).map((f) => (
          <button
            key={f}
            onClick={() => setFmt(f)}
            className={`px-2 py-1 rounded text-xs font-medium min-h-[36px] min-w-[44px] transition-colors ${
              fmt === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <span className="font-mono text-xs sm:text-sm text-foreground truncate max-w-[50vw]">{text}</span>
      <button
        onClick={copy}
        aria-label="Copiar coordenada"
        className="p-2 text-muted-foreground hover:text-foreground min-h-[36px] min-w-[36px]"
      >
        <Copy size={14} />
      </button>
    </div>
  );
};

export default CoordinateReadout;
