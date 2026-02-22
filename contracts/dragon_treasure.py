# { "Depends": "py-genlayer:test" }

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
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()
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
        return self.treasure_count
