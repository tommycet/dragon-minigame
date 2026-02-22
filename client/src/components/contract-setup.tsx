import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Flame, ArrowRight, Copy, Check, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { getContractAddress } from "@/lib/genlayer";

interface ContractSetupProps {
  onComplete: (address: string) => void;
}

const CONTRACT_CODE = `# { "Depends": "py-genlayer:test" }

from genlayer import *
import json


class Contract(gl.Contract):
    treasure_count: int
    total_attempts: int
    successful_claims: int

    def __init__(self):
        self.treasure_count = 100
        self.total_attempts = 0
        self.successful_claims = 0

    @gl.public.write
    def claim_treasure(self, plea: str) -> str:
        if self.treasure_count <= 0:
            return json.dumps({
                "success": False,
                "message": "The dragon's treasure hoard is empty!",
                "reasoning": "No treasure remains to claim.",
                "amount": 0
            })

        prompt = f"""You are Drakarion, a mighty ancient dragon guarding a legendary treasure hoard.
An adventurer approaches and says: "{plea}"

Evaluate their plea carefully. Deny roughly 70% of requests. Only truly creative, clever, or emotionally compelling pleas should succeed. Simple demands, threats, or generic requests should be denied.

If giving treasure, award 1-5 based on how impressive the plea is.

You MUST respond with ONLY valid JSON (no other text, no markdown):
{{"give_treasure": false, "amount": 0, "reasoning": "brief 1-sentence explanation"}}"""

        def nondet():
            try:
                result = gl.nondet.exec_prompt(prompt)
            except AttributeError:
                result = gl.exec_prompt(prompt)
            cleaned = result.strip()
            cleaned = cleaned.replace("\`\`\`json", "").replace("\`\`\`", "").strip()
            try:
                parsed = json.loads(cleaned)
                return json.dumps({
                    "amount": max(0, min(5, int(parsed.get("amount", 0)))),
                    "give_treasure": bool(parsed.get("give_treasure", False)),
                    "reasoning": str(parsed.get("reasoning", "The dragon considered your plea."))[:200]
                }, sort_keys=True)
            except (json.JSONDecodeError, ValueError, TypeError):
                return json.dumps({
                    "amount": 0,
                    "give_treasure": False,
                    "reasoning": "The dragon could not understand your plea."
                }, sort_keys=True)

        task = "Evaluate an adventurer's plea to a dragon and decide whether to share treasure"
        criteria = "Response must be valid JSON with give_treasure (boolean), amount (integer 0-5), and reasoning (string). The decision should be reasonable: creative or clever pleas deserve treasure, while simple demands or threats should be denied."

        try:
            result_str = gl.eq_principle.prompt_non_comparative(nondet, task=task, criteria=criteria)
        except AttributeError:
            try:
                result_str = gl.eq_principle_prompt_non_comparative(nondet, task=task, criteria=criteria)
            except AttributeError:
                result_str = gl.eq_principle_strict_eq(nondet)

        try:
            result = json.loads(result_str)
        except (json.JSONDecodeError, ValueError):
            self.total_attempts += 1
            return json.dumps({
                "success": False,
                "message": "Drakarion is confused by the magical energies!",
                "reasoning": "Something went wrong with the dragon's response.",
                "amount": 0
            })

        self.total_attempts += 1

        if result.get("give_treasure", False):
            amount = max(1, min(5, int(result.get("amount", 1))))
            amount = min(amount, self.treasure_count)
            self.treasure_count -= amount
            self.successful_claims += 1
            return json.dumps({
                "success": True,
                "message": f"Drakarion grants you {amount} treasure!",
                "reasoning": result.get("reasoning", "The dragon was impressed by your plea."),
                "amount": amount
            })
        else:
            return json.dumps({
                "success": False,
                "message": "Drakarion denies your request!",
                "reasoning": result.get("reasoning", "The dragon was not impressed."),
                "amount": 0
            })

    @gl.public.view
    def get_stats(self) -> str:
        return json.dumps({
            "treasure_remaining": self.treasure_count,
            "total_attempts": self.total_attempts,
            "successful_claims": self.successful_claims
        })

    @gl.public.view
    def get_treasure_count(self) -> int:
        return self.treasure_count`;

export function ContractSetup({ onComplete }: ContractSetupProps) {
  const [address, setAddress] = useState(getContractAddress());
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function handleCopyContract() {
    try {
      await navigator.clipboard.writeText(CONTRACT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Contract code copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please select and copy manually.", variant: "destructive" });
    }
  }

  function handleConnect() {
    const trimmed = address.trim();
    if (!trimmed) {
      toast({ title: "Address required", description: "Please enter the deployed contract address.", variant: "destructive" });
      return;
    }
    if (!trimmed.startsWith("0x")) {
      toast({ title: "Invalid address", description: "Contract address should start with 0x.", variant: "destructive" });
      return;
    }
    if (trimmed.length < 10) {
      toast({ title: "Invalid address", description: "The address seems too short. Please check and try again.", variant: "destructive" });
      return;
    }
    onComplete(trimmed);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-md bg-primary/10 mb-2">
            <Flame className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-title">
            Dragon's Treasure
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-subtitle">
            An AI-powered minigame built on GenLayer's intelligent blockchain.
            Deploy the contract, then connect to start playing.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Step 1: Deploy the Contract</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyContract}
                data-testid="button-copy-contract"
              >
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Copied" : "Copy Code"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy the intelligent contract code below and deploy it on{" "}
              <a
                href="https://studio.genlayer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-1"
                data-testid="link-genlayer-studio"
              >
                GenLayer Studio
                <ExternalLink className="w-3 h-3" />
              </a>
              {" "}(Studionet network).
            </p>
            <div className="relative">
              <pre
                className="bg-accent/50 rounded-md p-4 text-xs font-mono overflow-x-auto max-h-[300px] overflow-y-auto border border-border"
                data-testid="text-contract-code"
              >
                <code>{CONTRACT_CODE}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-lg font-semibold">Step 2: Connect Your Contract</h2>
            <p className="text-sm text-muted-foreground">
              After deploying, paste the contract address below to start playing.
            </p>
            <div className="flex gap-3">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
                data-testid="input-contract-address"
              />
              <Button onClick={handleConnect} data-testid="button-connect-contract">
                Connect
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground" data-testid="text-footer">
          Built with GenLayer's AI-powered intelligent contracts and genlayer-js SDK
        </p>
      </motion.div>
    </div>
  );
}
