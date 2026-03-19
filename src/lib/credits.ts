import { createAdminClient } from "@/lib/supabase/admin";

export async function deductCredits(
  userId: string,
  amount: number,
  generationId: string,
  description?: string
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_generation_id: generationId,
    p_description: description ?? null,
  });

  if (error) throw new Error(`Credit deduction failed: ${error.message}`);
  return data; // generation_id or null if insufficient
}

export async function refundCredits(
  userId: string,
  amount: number,
  generationId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("refund_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_generation_id: generationId,
  });

  if (error) throw new Error(`Credit refund failed: ${error.message}`);
}

export async function grantCredits(
  userId: string,
  amount: number,
  type: "subscription_grant" | "topup_purchase",
  stripeEventId: string,
  description?: string
): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("grant_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_stripe_event_id: stripeEventId,
    p_description: description ?? null,
  });

  if (error) throw new Error(`Credit grant failed: ${error.message}`);
  return data; // new balance or -1 if already processed
}
