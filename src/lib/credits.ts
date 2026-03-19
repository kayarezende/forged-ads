import { queryOne } from "@/lib/db";

export async function deductCredits(
  userId: string,
  amount: number,
  generationId: string,
  description?: string
): Promise<string | null> {
  const result = await queryOne<{ deduct_credits: string | null }>(
    `SELECT deduct_credits($1, $2, $3, $4)`,
    [userId, amount, generationId, description ?? null]
  );
  return result?.deduct_credits ?? null;
}

export async function refundCredits(
  userId: string,
  amount: number,
  generationId: string
): Promise<void> {
  await queryOne(
    `SELECT refund_credits($1, $2, $3)`,
    [userId, amount, generationId]
  );
}

export async function grantCredits(
  userId: string,
  amount: number,
  type: "subscription_grant" | "topup_purchase",
  stripeEventId: string,
  description?: string
): Promise<number> {
  const result = await queryOne<{ grant_credits: number }>(
    `SELECT grant_credits($1, $2, $3::credit_tx_type, $4, $5)`,
    [userId, amount, type, stripeEventId, description ?? null]
  );
  return result?.grant_credits ?? -1;
}

export async function checkRateLimit(
  userId: string,
  windowSeconds = 60,
  maxRequests = 10
): Promise<boolean> {
  const result = await queryOne<{ check_rate_limit: boolean }>(
    `SELECT check_rate_limit($1, $2, $3)`,
    [userId, windowSeconds, maxRequests]
  );
  return result?.check_rate_limit ?? false;
}
