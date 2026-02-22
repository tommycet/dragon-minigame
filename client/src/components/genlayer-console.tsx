import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribe, getLogs, clearLogs, type ConsoleEntry, type LogLevel } from "@/lib/console-log";

const levelConfig: Record<LogLevel, { color: string; prefix: string; dot: string }> = {
  system: { color: "text-violet-400", prefix: "SYS", dot: "bg-violet-400" },
  info: { color: "text-blue-400", prefix: "RPC", dot: "bg-blue-400" },
  success: { color: "text-emerald-400", prefix: " OK", dot: "bg-emerald-400" },
  warn: { color: "text-amber-400", prefix: "WRN", dot: "bg-amber-400" },
  error: { color: "text-red-400", prefix: "ERR", dot: "bg-red-400" },
};

function formatTs(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ConsoleRow({ entry }: { entry: ConsoleEntry }) {
  const cfg = levelConfig[entry.level];
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-start gap-2 py-1 px-2 rounded group"
      data-testid={`console-entry-${entry.id}`}
    >
      <span className="text-[11px] text-zinc-600 font-mono shrink-0 mt-px select-none">
        {formatTs(entry.timestamp)}
      </span>
      <div className={`flex items-center gap-1 shrink-0 mt-px`}>
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span className={`text-[10px] font-mono font-bold ${cfg.color} select-none`}>
          {cfg.prefix}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-mono text-zinc-300 leading-snug break-all">
          {entry.message}
        </span>
        {entry.detail && (
          <span className="text-[11px] font-mono text-zinc-600 ml-1.5 break-all">
            {entry.detail}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function GenLayerConsole() {
  const [logs, setLogs] = useState<ConsoleEntry[]>(getLogs());
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribe(setLogs);
  }, []);

  const activeCount = logs.filter((l) => l.level === "info" || l.level === "system").length;
  const errorCount = logs.filter((l) => l.level === "error").length;

  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-950/95 backdrop-blur" data-testid="card-genlayer-console">
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-1.5 ml-1">
            <Terminal className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400 font-mono">
              GenLayer Activity
            </span>
          </div>
          {logs.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-zinc-800 text-zinc-400 border-0">
              {logs.length}
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
              {errorCount} err
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!collapsed && logs.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); clearLogs(); }}
              data-testid="button-clear-console"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
          {collapsed ? (
            <ChevronUp className="w-4 h-4 text-zinc-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-600" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="p-0">
              <ScrollArea className="h-[200px]" ref={scrollRef}>
                <div className="p-2 space-y-0">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-[180px]">
                      <div className="text-center space-y-1.5">
                        <Terminal className="w-6 h-6 text-zinc-700 mx-auto" />
                        <p className="text-[11px] font-mono text-zinc-700">
                          Waiting for GenLayer activity...
                        </p>
                      </div>
                    </div>
                  ) : (
                    logs.map((entry) => (
                      <ConsoleRow key={entry.id} entry={entry} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
