import { useRef } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Waypoint, Route } from "@/data/mapTypes";
import { serializeGPX, parseGPX } from "@/lib/gpx";
import { serializeKML, parseKML } from "@/lib/kml";

interface Props {
  waypoints: Waypoint[];
  routes: Route[];
  onImport: (waypoints: Waypoint[], routes: Route[]) => void;
}

const download = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const ImportExportMenu = ({ waypoints, routes, onImport }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const ext = file.name.toLowerCase();
      let wpts: Waypoint[] = [];
      let rts: Route[] = [];
      if (ext.endsWith(".gpx")) {
        const parsed = parseGPX(text);
        wpts = parsed.waypoints;
        rts = parsed.routes;
      } else if (ext.endsWith(".kml")) {
        const parsed = parseKML(text);
        wpts = parsed.waypoints;
        rts = parsed.routes;
      } else {
        toast.error("Formato não suportado. Use .gpx ou .kml");
        return;
      }
      onImport(wpts, rts);
      toast.success(`Importado: ${wpts.length} waypoints, ${rts.length} rotas`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao importar");
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx,.kml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="secondary" className="h-12 w-12 shadow-lg" aria-label="Importar/Exportar" title="Importar/Exportar">
            <FileText size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Exportar</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={!waypoints.length}
            onClick={() => download(serializeGPX(waypoints, []), `waypoints-${timestamp()}.gpx`, "application/gpx+xml")}
          >
            <Download size={14} className="mr-2" /> Waypoints (GPX)
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!waypoints.length}
            onClick={() => download(serializeKML(waypoints, []), `waypoints-${timestamp()}.kml`, "application/vnd.google-earth.kml+xml")}
          >
            <Download size={14} className="mr-2" /> Waypoints (KML)
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!routes.length}
            onClick={() => download(serializeGPX([], routes), `rotas-${timestamp()}.gpx`, "application/gpx+xml")}
          >
            <Download size={14} className="mr-2" /> Rotas (GPX)
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!routes.length}
            onClick={() => download(serializeKML([], routes), `rotas-${timestamp()}.kml`, "application/vnd.google-earth.kml+xml")}
          >
            <Download size={14} className="mr-2" /> Rotas (KML)
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!waypoints.length && !routes.length}
            onClick={() => download(serializeGPX(waypoints, routes), `gis-tudo-${timestamp()}.gpx`, "application/gpx+xml")}
          >
            <Download size={14} className="mr-2" /> Tudo (GPX)
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!waypoints.length && !routes.length}
            onClick={() => download(serializeKML(waypoints, routes), `gis-tudo-${timestamp()}.kml`, "application/vnd.google-earth.kml+xml")}
          >
            <Download size={14} className="mr-2" /> Tudo (KML)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Importar</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => inputRef.current?.click()}>
            <Upload size={14} className="mr-2" /> Arquivo GPX ou KML
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default ImportExportMenu;
