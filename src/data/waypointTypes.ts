import {
  Home,
  Droplet,
  AlertTriangle,
  Tent,
  Package,
  Eye,
  Route as RouteIcon,
  Plane,
  Users,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import type { WaypointType } from "./mapTypes";

export interface WaypointTypeConfig {
  icon: LucideIcon;
  label: string;
  emoji: string;
  color: string; // CSS var name (without hsl())
  hex: string;   // fallback hex for export/import interoperability
}

export const WAYPOINT_TYPES: Record<WaypointType, WaypointTypeConfig> = {
  base:       { icon: Home,          label: "Base",          emoji: "🏠", color: "primary",     hex: "#F97316" },
  agua:       { icon: Droplet,       label: "Água",          emoji: "💧", color: "info",        hex: "#3B82F6" },
  perigo:     { icon: AlertTriangle, label: "Perigo",        emoji: "⚠️", color: "destructive", hex: "#DC2626" },
  abrigo:     { icon: Tent,          label: "Abrigo",        emoji: "⛺", color: "forest",      hex: "#2D5016" },
  recurso:    { icon: Package,       label: "Recurso",       emoji: "📦", color: "earth",       hex: "#8B5A2B" },
  observacao: { icon: Eye,           label: "Observação",    emoji: "👁️", color: "muted",       hex: "#94A3B8" },
  rota:       { icon: RouteIcon,     label: "Ponto de rota", emoji: "🧭", color: "primary",     hex: "#F97316" },
  extracao:   { icon: Plane,         label: "Extração",      emoji: "🛩️", color: "info",        hex: "#0EA5E9" },
  contato:    { icon: Users,         label: "Contato",       emoji: "👥", color: "earth",       hex: "#B45309" },
  generico:   { icon: MapPin,        label: "Genérico",      emoji: "📍", color: "foreground",  hex: "#F5F5F4" },
};

export const WAYPOINT_TYPE_LIST: WaypointType[] = [
  "base", "agua", "perigo", "abrigo", "recurso",
  "observacao", "rota", "extracao", "contato", "generico",
];
