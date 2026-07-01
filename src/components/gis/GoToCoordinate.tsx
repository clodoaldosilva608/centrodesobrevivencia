import { useState } from "react";
import { useMap } from "react-leaflet";
import { Crosshair } from "lucide-react";
import { parseCoordinate } from "@/lib/mgrs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

const GoToCoordinate = () => {
  const map = useMap();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleGo = () => {
    const parsed = parseCoordinate(value);
    if (!parsed) {
      toast.error("Coordenada inválida. Use DD, DMS ou MGRS.");
      return;
    }
    map.flyTo([parsed.lat, parsed.lng], Math.max(map.getZoom(), 14), { duration: 1.2 });
    setOpen(false);
    setValue("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          aria-label="Ir para coordenada"
          className="h-12 w-12 shadow-lg"
        >
          <Crosshair size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ir para coordenada</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            autoFocus
            placeholder={`Ex.: -15.7801, -47.9292  ou  15°46'48"S 47°55'45"W  ou  22LGK1234567890`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
          />
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: Decimal (lat, lng), Graus-Minutos-Segundos ou MGRS.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleGo}>Ir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoToCoordinate;
