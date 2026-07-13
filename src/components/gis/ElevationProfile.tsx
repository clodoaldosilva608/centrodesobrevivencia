import { useEffect, useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchElevationProfile, elevationStats, type ElevationSample } from "@/lib/elevation";
import type { LatLng } from "@/lib/geo";
import { Loader2, TrendingDown, TrendingUp, Mountain, Waves } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  path: LatLng[];
}

const ElevationProfile = ({ open, onOpenChange, path }: Props) => {
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState<ElevationSample[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || path.length < 2) return;
    setLoading(true); setError(null);
    fetchElevationProfile(path, 80)
      .then((d) => setSamples(d))
      .catch((e) => {
        setError("Não foi possível obter dados de elevação (verifique conexão).");
        toast.error("Falha ao carregar perfil de elevação");
        console.error(e);
      })
      .finally(() => setLoading(false));
  }, [open, path]);

  const stats = elevationStats(samples);
  const chartData = samples.map((s) => ({
    dist: +(s.dist / 1000).toFixed(3),
    elev: Math.round(s.elevation),
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Mountain size={20} className="text-primary" /> Perfil de elevação
          </SheetTitle>
          <SheetDescription>
            Amostras do path via Open-Elevation. Dados em cache por 7 dias.
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex items-center justify-center text-destructive text-center p-6">
            {error}
          </div>
        )}

        {!loading && !error && samples.length > 0 && (
          <>
            <div className="grid grid-cols-4 gap-2 py-3">
              <Stat icon={<Waves size={14} />} label="Mín" value={`${Math.round(stats.min)} m`} />
              <Stat icon={<Mountain size={14} />} label="Máx" value={`${Math.round(stats.max)} m`} />
              <Stat icon={<TrendingUp size={14} className="text-primary" />} label="Ganho" value={`+${Math.round(stats.gain)} m`} />
              <Stat icon={<TrendingDown size={14} className="text-destructive" />} label="Perda" value={`-${Math.round(stats.loss)} m`} />
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="dist" tick={{ fontSize: 11 }} label={{ value: "km", position: "insideBottomRight", offset: -4, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: "m", angle: -90, position: "insideLeft", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v) => [`${v} m`, "Elevação"]}
                    labelFormatter={(l) => `${l} km`}
                  />
                  <Area type="monotone" dataKey="elev" stroke="hsl(var(--primary))" fill="url(#elev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="border border-border rounded-md p-2">
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase">{icon}{label}</div>
    <div className="font-mono font-bold text-sm">{value}</div>
  </div>
);

export default ElevationProfile;
