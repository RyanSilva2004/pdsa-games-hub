"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Grid,
  MapPin,
  BarChart3,
  Puzzle,
  Castle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface GameProps {
  game: {
    id: string;
    title: string;
    description: string;
    icon: string;
    iconColor?: string;
    status: "ready" | "coming-soon";
    developer: string;
    path: string;
  };
}

export function GameCard({ game }: GameProps) {
  const icons: Record<string, LucideIcon> = {
    Grid,
    MapPin,
    BarChart3,
    Puzzle,
    Castle,
  };

  // Ensure the icon exists in the icons map, fallback to Grid if not
  const IconComponent = icons[game.icon] || Grid;

  return (
    <Link href={game.path}>
      <Card className="overflow-hidden border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900/50 transition-colors cursor-pointer">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 flex items-center justify-center">
              {/* Ensure iconColor is deterministic and fallback to "currentColor" */}
              <IconComponent
                className="h-8 w-8"
                style={{ color: game.iconColor || "currentColor" }}
              />
            </div>
            <Badge
              variant={game.status === "ready" ? "default" : "secondary"}
              className={
                game.status === "ready"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-zinc-800 text-zinc-300"
              }
            >
              {game.status === "ready" ? "Ready" : "Coming Soon"}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
          <p className="text-zinc-400 mb-4">{game.description}</p>

          {game.status === "ready" ? (
            <div className="text-purple-500 cursor-pointer hover:underline">
              Click to play
            </div>
          ) : (
            <div className="text-zinc-500">Coming soon</div>
          )}
        </div>
      </Card>
    </Link>
  );
}
