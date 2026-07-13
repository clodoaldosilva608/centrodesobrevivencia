import { Ruler, Hexagon, Mountain, Compass, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Tool = "distance" | "area" | "compass" | null;

interface Props {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  onOpenElevation: () => void;
  onClear: () => void;
  elevationEnabled: boolean;
  unit: "metric" | "nautical";
  onUnitChange: (u: "metric" | "nautical") => void;
}

const btn = "h-12 w-12 shadow-lg";

const MeasureToolbar = ({
  tool, onToolChange, onOpenElevation, onClear, elevationEnabled, unit, onUnitChange,
}: Props) => (
  <div className="flex flex-col gap-2">
    <Button
      size="icon" variant={tool === "distance" ? "default" : "secondary"}
      className={cn(btn, tool === "distance" && "bg-primary text-primary-foreground")}
      onClick={() => onToolChange(tool === "distance" ? null : "distance")}
      aria-label="Medir distância" title="Medir distância"
    >
      <Ruler size={20} />
    </Button>
    <Button
      size="icon" variant={tool === "area" ? "default" : "secondary"}
      className={cn(btn, tool === "area" && "bg-primary text-primary-foreground")}
      onClick={() => onToolChange(tool === "area" ? null : "area")}
      aria-label="Medir área" title="Medir área"
    >
      <Hexagon size={20} />
    </Button>
    <Button
      size="icon" variant="secondary" className={btn}
      onClick={onOpenElevation} disabled={!elevationEnabled}
      aria-label="Perfil de elevação" title="Perfil de elevação"
    >
      <Mountain size={20} />
    </Button>
    <Button
      size="icon" variant={tool === "compass" ? "default" : "secondary"}
      className={cn(btn, tool === "compass" && "bg-primary text-primary-foreground")}
      onClick={() => onToolChange(tool === "compass" ? null : "compass")}
      aria-label="Bússola" title="Bússola"
    >
      <Compass size={20} />
    </Button>
    <Button
      size="icon" variant="secondary" className={btn}
      onClick={() => onUnitChange(unit === "metric" ? "nautical" : "metric")}
      aria-label="Alternar unidade" title={`Unidade: ${unit === "metric" ? "métrica" : "náutica"}`}
    >
      <span className="text-[10px] font-bold">{unit === "metric" ? "KM" : "NM"}</span>
    </Button>
    <Button
      size="icon" variant="secondary" className={btn}
      onClick={onClear} aria-label="Limpar tudo" title="Limpar tudo"
    >
      <Trash2 size={18} />
    </Button>
  </div>
);

export default MeasureToolbar;
