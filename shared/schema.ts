import { z } from "zod";

export const gameResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  reasoning: z.string(),
  amount: z.number(),
});

export const gameStatsSchema = z.object({
  treasure_remaining: z.coerce.number(),
  total_attempts: z.coerce.number(),
  successful_claims: z.coerce.number(),
});

export const pleaSchema = z.object({
  plea: z.string().min(1, "Your plea cannot be empty").max(500, "Your plea is too long (max 500 characters)"),
});

export type GameResult = z.infer<typeof gameResultSchema>;
export type GameStats = z.infer<typeof gameStatsSchema>;
export type PleaInput = z.infer<typeof pleaSchema>;

export interface GameHistoryEntry {
  id: string;
  plea: string;
  result: GameResult;
  timestamp: number;
}
