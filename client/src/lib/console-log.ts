export type LogLevel = "info" | "success" | "warn" | "error" | "system";

export interface ConsoleEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  detail?: string;
}

type Listener = (entries: ConsoleEntry[]) => void;

const MAX_ENTRIES = 100;
let entries: ConsoleEntry[] = [];
let listeners: Set<Listener> = new Set();
let idCounter = 0;

function notify() {
  listeners.forEach((fn) => fn([...entries]));
}

export function addLog(level: LogLevel, message: string, detail?: string) {
  const entry: ConsoleEntry = {
    id: `log-${++idCounter}`,
    timestamp: Date.now(),
    level,
    message,
    detail,
  };
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  notify();
}

export function clearLogs() {
  entries = [];
  idCounter = 0;
  notify();
}

export function getLogs(): ConsoleEntry[] {
  return [...entries];
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
