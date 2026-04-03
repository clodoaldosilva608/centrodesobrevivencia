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

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  note: string;
  color: string;
  createdAt: string;
}
