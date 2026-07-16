import { LucideIcon } from "lucide-react";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  type: "water" | "danger" | "shelter" | "resource" | "event";
  name: string;
  description: string;
  discovered: boolean;
  xpReward: number;
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  iconName: string;
  options: { label: string; effect: string; xp: number; outcome: "positive" | "negative" | "neutral" }[];
}

export interface TypeConfig {
  icon: LucideIcon;
  color: string;
  label: string;
  emoji: string;
}

export type WaypointType =
  | "base"
  | "agua"
  | "perigo"
  | "abrigo"
  | "recurso"
  | "observacao"
  | "rota"
  | "extracao"
  | "contato"
  | "generico";

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  note: string;
  color: string;
  type: WaypointType;
  createdAt: string;
}

export interface Route {
  id: string;
  name: string;
  color: string;
  points: { lat: number; lng: number }[];
  notes?: string;
  createdAt: string;
}
