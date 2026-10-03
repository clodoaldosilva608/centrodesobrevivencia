import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Waypoint, WaypointType } from "@/data/mapTypes";
import { WAYPOINT_TYPES, WAYPOINT_TYPE_LIST } from "@/data/waypointTypes";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Partial<Waypoint> | null;
  onSave: (data: Omit<Waypoint, "id" | "createdAt"> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

const WaypointDialog = ({ open, onOpenChange, initial, onSave, onDelete }: Props) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<WaypointType>("generico");
  const [color, setColor] = useState("#F97316");
  const [note, setNote] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    const t = (initial?.type as WaypointType) ?? "generico";
    setType(t);
    setColor(initial?.color ?? WAYPOINT_TYPES[t].hex);
    setNote(initial?.note ?? "");
    setLat(initial?.lat != null ? String(initial.lat) : "");
    setLng(initial?.lng != null ? String(initial.lng) : "");
  }, [open, initial]);

  const handleSave = () => {
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (!name.trim()) return toast.error("Nome obrigatório");
    if (!Number.isFinite(latN) || Math.abs(latN) > 90) return toast.error("Latitude inválida");
    if (!Number.isFinite(lngN) || Math.abs(lngN) > 180) return toast.error("Longitude inválida");
    onSave({
      id: initial?.id,
      name: name.trim(),
      type,
      color,
      note,
      lat: latN,
      lng: lngN,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar waypoint" : "Novo waypoint"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Base Alpha" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => {
                const t = v as WaypointType;
                setType(t);
                setColor(WAYPOINT_TYPES[t].hex);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WAYPOINT_TYPE_LIST.map((t) => (
                    <SelectItem key={t} value={t}>
                      {WAYPOINT_TYPES[t].emoji} {WAYPOINT_TYPES[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 rounded border border-input bg-transparent" />
                <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Latitude</Label>
              <Input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" />
            </div>
          </div>
          <div>
            <Label>Nota</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="Observações táticas, riscos, recursos..." />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {initial?.id && onDelete && (
              <Button variant="destructive" onClick={() => { onDelete(initial.id!); onOpenChange(false); }}>
                Remover
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WaypointDialog;
