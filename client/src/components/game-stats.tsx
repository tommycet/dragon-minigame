import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Coins, Target, Trophy, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GameStats } from "@shared/schema";

interface GameStatsPanelProps {
  stats: GameStats | null;
  loading: boolean;
}

export function GameStatsPanel({ stats, loading }: GameStatsPanelProps) {
  if (loading && !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const treasurePercent = (stats.treasure_remaining / 100) * 100;
  const successRate =
    stats.total_attempts > 0
      ? Math.round((stats.successful_claims / stats.total_attempts) * 100)
      : 0;

  return (
    <Card data-testid="card-game-stats">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Treasure Remaining</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" data-testid="text-treasure-remaining">
                {stats.treasure_remaining}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <Progress value={treasurePercent} className="h-1.5" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Attempts</span>
            </div>
            <span className="text-2xl font-bold" data-testid="text-total-attempts">
              {stats.total_attempts}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Success Rate</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" data-testid="text-success-rate">
                {successRate}%
              </span>
              <span className="text-sm text-muted-foreground">
                ({stats.successful_claims} wins)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
