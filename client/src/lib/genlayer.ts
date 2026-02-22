import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { GameResult, GameStats } from "@shared/schema";
import { addLog } from "@/lib/console-log";

const STORAGE_KEY = "genlayer_account_key";
const CONTRACT_ADDRESS_KEY = "genlayer_contract_address";

function getOrCreatePrivateKey(): `0x${string}` {
  let key = localStorage.getItem(STORAGE_KEY);
  if (!key || !key.startsWith("0x")) {
    const newKey = generatePrivateKey();
    localStorage.setItem(STORAGE_KEY, newKey);
    return newKey;
  }
  return key as `0x${string}`;
}

export function getContractAddress(): string {
  return localStorage.getItem(CONTRACT_ADDRESS_KEY) || "";
}

export function setContractAddress(address: string) {
  localStorage.setItem(CONTRACT_ADDRESS_KEY, address);
}

export function createGenLayerClient() {
  const privateKey = getOrCreatePrivateKey();
  const account = createAccount(privateKey);

  const proxyEndpoint = `${window.location.origin}/api/genlayer-rpc`;

  const client = createClient({
    chain: studionet,
    account,
    endpoint: proxyEndpoint,
  });

  addLog("system", "Client initialized", `account ${account.address.slice(0, 10)}...`);

  return { client, account };
}

export async function readGameStats(contractAddress: string): Promise<GameStats> {
  const { client } = createGenLayerClient();
  addLog("info", "gen_call get_stats()", `contract ${contractAddress.slice(0, 10)}...`);
  try {
    const result = await client.readContract({
      address: contractAddress as `0x${string}`,
      functionName: "get_stats",
      args: [],
    });
    if (typeof result === "string") {
      try {
        const stats = JSON.parse(result);
        addLog("success", "Stats received", `${stats.treasure_remaining} treasure, ${stats.total_attempts} attempts`);
        return stats;
      } catch {
        const b64Decoded = tryDecodeBase64Result(result);
        if (b64Decoded) {
          const stats = JSON.parse(b64Decoded);
          addLog("success", "Stats decoded (base64)", `${stats.treasure_remaining} treasure, ${stats.total_attempts} attempts`);
          return stats;
        }
      }
    }
    addLog("success", "Stats received");
    return result as GameStats;
  } catch (err: any) {
    addLog("error", "Failed to read stats", err.message?.slice(0, 80) || "Unknown error");
    throw err;
  }
}

export async function readTreasureCount(contractAddress: string): Promise<number> {
  const { client } = createGenLayerClient();
  const result = await client.readContract({
    address: contractAddress as `0x${string}`,
    functionName: "get_treasure_count",
    args: [],
  });
  return Number(result);
}

function deepSearchForError(obj: any, depth = 0): string | null {
  if (depth > 10 || !obj) return null;

  if (typeof obj === "string") {
    if (obj === "ERROR" || obj.includes("AttributeError") || obj.includes("Traceback")) {
      return obj;
    }
    return null;
  }

  if (typeof obj !== "object") return null;

  if (obj.execution_result === "ERROR" || obj.status === "ERROR") {
    const errorDetail = obj.error || obj.message || obj.error_message || "Contract execution failed";
    return typeof errorDetail === "string" ? errorDetail : JSON.stringify(errorDetail);
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string" && (val === "ERROR" || val.includes("AttributeError") || val.includes("Traceback"))) {
      return val;
    }
    if (typeof val === "object" && val !== null) {
      const found = deepSearchForError(val, depth + 1);
      if (found) return found;
    }
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = deepSearchForError(item, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

function tryDecodeBase64Result(str: string): string | null {
  try {
    const decoded = atob(str);
    const jsonStart = decoded.indexOf("{");
    if (jsonStart === -1) return null;
    const jsonStr = decoded.substring(jsonStart);
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed.success === "boolean") return jsonStr;
  } catch {}
  return null;
}

function tryParseGameResult(str: string): string | null {
  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed.success === "boolean") return str;
  } catch {}
  return tryDecodeBase64Result(str);
}

function extractResultFromReceipt(receipt: any): string | null {
  if (!receipt || typeof receipt !== "object") return null;

  const receiptObj = receipt as any;

  const leaderReceipts = receiptObj?.consensus_data?.leader_receipt;
  if (leaderReceipts) {
    const receipts = Array.isArray(leaderReceipts) ? leaderReceipts : [leaderReceipts];
    for (const lr of receipts) {
      if (lr.execution_result === "SUCCESS" && typeof lr.result === "string") {
        const fromResult = tryParseGameResult(lr.result);
        if (fromResult) return fromResult;
      }
      if (lr.eq_outputs && typeof lr.eq_outputs === "object") {
        for (const val of Object.values(lr.eq_outputs)) {
          if (typeof val === "string") {
            const fromEq = tryParseGameResult(val);
            if (fromEq) return fromEq;
          }
        }
      }
    }
  }

  if (receiptObj?.data?.calldata?.readable) {
    const fromReadable = tryParseGameResult(receiptObj.data.calldata.readable);
    if (fromReadable) return fromReadable;
  }

  return deepSearchForResult(receipt);
}

function deepSearchForResult(obj: any, depth = 0): string | null {
  if (depth > 10 || !obj) return null;

  if (typeof obj === "string") {
    const result = tryParseGameResult(obj);
    if (result) return result;
  }

  if (typeof obj !== "object") return null;

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      const result = tryParseGameResult(val);
      if (result) return result;
    }
    if (typeof val === "object" && val !== null) {
      const found = deepSearchForResult(val, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

export async function claimTreasure(
  contractAddress: string,
  plea: string
): Promise<GameResult> {
  const { client } = createGenLayerClient();

  addLog("info", "writeContract claim_treasure()", `plea: "${plea.slice(0, 40)}..."`);
  addLog("system", "Submitting transaction to GenLayer studionet...");

  const txHash = await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: "claim_treasure",
    args: [plea],
    value: BigInt(0),
    leaderOnly: true,
  } as any);

  addLog("success", "Transaction submitted", `hash: ${txHash.slice(0, 18)}...`);
  addLog("info", "Waiting for validator consensus...", "status: PENDING → PROPOSING");

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: "FINALIZED" as any,
    retries: 120,
    interval: 3000,
  });

  const receiptObj = receipt as any;
  const resultName = receiptObj?.result_name || "UNKNOWN";
  addLog("system", `Consensus reached: ${resultName}`, `status: FINALIZED`);

  console.log("Transaction receipt:", JSON.stringify(receipt, null, 2));

  if (receiptObj?.result_name === "MAJORITY_DISAGREE" || receiptObj?.result === 7) {
    addLog("error", "MAJORITY_DISAGREE", "Validators could not agree on result");
    throw new Error(
      "The validators couldn't reach consensus on the dragon's decision. This usually means the contract needs to be redeployed with the latest code. Click the settings icon, copy the updated contract, redeploy it on GenLayer Studio, and enter the new address."
    );
  }
  if (receiptObj?.result_name === "UNDETERMINED") {
    addLog("error", "UNDETERMINED", "Transaction result could not be finalized");
    throw new Error(
      "The transaction result was undetermined. The validators couldn't finalize a decision. Please try again."
    );
  }

  const contractError = deepSearchForError(receipt);
  if (contractError) {
    addLog("error", "Contract execution error", contractError.slice(0, 80));
    const isApiError = contractError.includes("AttributeError") || contractError.includes("Traceback");
    const userMessage = isApiError
      ? "The contract encountered an API compatibility error. The contract needs to be redeployed with updated code. Please copy the latest contract code from the setup page, redeploy it on GenLayer Studio, and enter the new contract address."
      : `The contract execution failed: ${contractError.substring(0, 200)}. Try redeploying the contract with the latest code.`;
    throw new Error(userMessage);
  }

  addLog("info", "Decoding transaction receipt...");

  const resultStr = extractResultFromReceipt(receipt);
  if (resultStr) {
    try {
      const parsed = JSON.parse(resultStr);
      if (parsed && typeof parsed.success === "boolean") {
        addLog("success", `Dragon decided: ${parsed.success ? "GRANTED" : "DENIED"}`, parsed.success ? `+${parsed.amount} treasure` : parsed.message?.slice(0, 50));
        return parsed as GameResult;
      }
    } catch {}
  }

  addLog("warn", "Retrying with fullTransaction flag...");

  const fullReceipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: "FINALIZED" as any,
    retries: 1,
    interval: 1000,
    fullTransaction: true,
  } as any);

  console.log("Full transaction receipt:", JSON.stringify(fullReceipt, null, 2));

  const fullResultStr = extractResultFromReceipt(fullReceipt);
  if (fullResultStr) {
    try {
      const parsed = JSON.parse(fullResultStr);
      if (parsed && typeof parsed.success === "boolean") {
        addLog("success", `Dragon decided: ${parsed.success ? "GRANTED" : "DENIED"}`, parsed.success ? `+${parsed.amount} treasure` : parsed.message?.slice(0, 50));
        return parsed as GameResult;
      }
    } catch {}
  }

  addLog("error", "Failed to extract result from receipt");

  throw new Error(
    "Could not extract game result from the transaction receipt. The transaction may have been processed but the result format was unexpected. Try redeploying the contract with the latest code."
  );
}
