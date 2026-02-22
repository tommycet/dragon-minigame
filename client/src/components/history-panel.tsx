import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Coins, Skull, ScrollText } from "lucide-react";
import type { GameHistoryEntry } from "@shared/schema";

interface HistoryPanelProps {
  history: GameHistoryEntry[];
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">History</h2>
          </div>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No pleas yet. Be the first to approach the dragon!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">History</h2>
          </div>
          <Badge variant="secondary">{history.length}</Badge>
        </div>

        <ScrollArea className="h-[500px] pr-2">
          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className={`p-3 rounded-md border ${
                  entry.result.success
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-accent/30"
                }`}
                data-testid={`card-history-${entry.id}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {entry.result.success ? (
                      <Coins className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Skull className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium">
                      {entry.result.success
                        ? `+${entry.result.amount} Treasure`
                        : "Denied"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-foreground line-clamp-2 mb-1">
                  "{entry.plea}"
                </p>
                <p className="text-xs text-muted-foreground italic line-clamp-2">
                  {entry.result.reasoning}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}
