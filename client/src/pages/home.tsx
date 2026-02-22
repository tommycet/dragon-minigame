import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Send, Loader2, ScrollText, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  getContractAddress,
  setContractAddress,
  readGameStats,
  claimTreasure,
} from "@/lib/genlayer";
import type { GameResult, GameStats, GameHistoryEntry } from "@shared/schema";
import { ContractSetup } from "@/components/contract-setup";
import { DragonResponse } from "@/components/dragon-response";
import { GameStatsPanel } from "@/components/game-stats";
import { HistoryPanel } from "@/components/history-panel";
import { GenLayerConsole } from "@/components/genlayer-console";
import { addLog } from "@/lib/console-log";

export default function Home() {
  const [contractAddr, setContractAddr] = useState(getContractAddress());
  const [plea, setPlea] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestResult, setLatestResult] = useState<GameResult | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [showSetup, setShowSetup] = useState(!contractAddr);
  const [statsLoading, setStatsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("dragon_game_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("dragon_game_history", JSON.stringify(history.slice(0, 50)));
    }
  }, [history]);

  useEffect(() => {
    if (contractAddr) {
      fetchStats();
    }
  }, [contractAddr]);

  async function fetchStats() {
    if (!contractAddr) return;
    setStatsLoading(true);
    try {
      const data = await readGameStats(contractAddr);
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plea.trim() || !contractAddr || isSubmitting) return;

    setIsSubmitting(true);
    setLatestResult(null);

    try {
      const result = await claimTreasure(contractAddr, plea.trim());
      setLatestResult(result);

      const entry: GameHistoryEntry = {
        id: Date.now().toString(),
        plea: plea.trim(),
        result,
        timestamp: Date.now(),
      };
      setHistory((prev) => [entry, ...prev]);

      await fetchStats();
      setPlea("");
    } catch (err: any) {
      toast({
        title: "Transaction Failed",
        description: err.message || "Something went wrong with the blockchain transaction.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSetupComplete(address: string) {
    setContractAddress(address);
    setContractAddr(address);
    setShowSetup(false);
    addLog("success", "Contract connected", `address: ${address.slice(0, 10)}...`);
    addLog("system", "GenLayer studionet ready");
    fetchStats();
  }

  if (showSetup) {
    return <ContractSetup onComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url(/images/dragon-bg.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Flame className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Dragon's Treasure</h1>
                <p className="text-sm text-muted-foreground">
                  Powered by GenLayer Intelligent Contracts
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSetup(true)}
              data-testid="button-settings"
            >
              <Settings2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GameStatsPanel stats={stats} loading={statsLoading} />

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <ScrollText className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Make Your Plea</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Convince Drakarion, the mighty dragon, to share his treasure. Be creative, brave, and clever!
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    ref={textareaRef}
                    value={plea}
                    onChange={(e) => setPlea(e.target.value)}
                    placeholder="Oh mighty Drakarion, I come bearing tales of adventure and seek your legendary generosity..."
                    className="min-h-[120px] resize-none text-base"
                    maxLength={500}
                    disabled={isSubmitting}
                    data-testid="input-plea"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {plea.length}/500 characters
                    </span>
                    <Button
                      type="submit"
                      disabled={!plea.trim() || isSubmitting}
                      data-testid="button-submit-plea"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Awaiting the Dragon's Judgment...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Plea
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <div className="flex flex-col items-center gap-3 p-6 rounded-md bg-accent/50">
                      <Flame className="w-8 h-8 text-primary animate-pulse" />
                      <p className="text-sm text-muted-foreground text-center">
                        Your plea echoes through the dragon's lair...
                        <br />
                        <span className="text-xs">
                          GenLayer validators are reaching consensus (this may take a moment)
                        </span>
                      </p>
                      <Progress value={undefined} className="w-48 h-1.5 animate-pulse" />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {latestResult && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <DragonResponse result={latestResult} />
                </motion.div>
              )}
            </AnimatePresence>

            <GenLayerConsole />
          </div>

          <div className="space-y-6">
            <HistoryPanel history={history} />
          </div>
        </div>
      </div>
    </div>
  );
}
