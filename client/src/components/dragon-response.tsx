import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Skull, Quote } from "lucide-react";
import { motion } from "framer-motion";
import type { GameResult } from "@shared/schema";

interface DragonResponseProps {
  result: GameResult;
}

export function DragonResponse({ result }: DragonResponseProps) {
  const isSuccess = result.success;

  return (
    <Card
      className={isSuccess ? "border-primary/30" : "border-destructive/20"}
      data-testid="card-dragon-response"
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-md shrink-0 ${
              isSuccess ? "bg-primary/10" : "bg-destructive/10"
            }`}
          >
            {isSuccess ? (
              <Coins className="w-6 h-6 text-primary" />
            ) : (
              <Skull className="w-6 h-6 text-destructive" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">
                {isSuccess ? "Treasure Granted!" : "Request Denied!"}
              </h3>
              {isSuccess && result.amount > 0 && (
                <Badge variant="default" data-testid="badge-treasure-amount">
                  +{result.amount} Treasure
                </Badge>
              )}
            </div>

            <p className="text-sm" data-testid="text-dragon-message">
              {result.message}
            </p>

            <div className="flex items-start gap-2 p-3 rounded-md bg-accent/50">
              <Quote className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground italic" data-testid="text-dragon-reasoning">
                {result.reasoning}
              </p>
            </div>
          </div>
        </div>

        {isSuccess && (
          <motion.div
            className="mt-4 flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <img
              src="/images/treasure-chest.png"
              alt="Treasure"
              className="w-24 h-24 object-contain opacity-80"
            />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
