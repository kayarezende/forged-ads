import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon } from "lucide-react";

export default async function BillingReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id) redirect("/billing");

  let status: "success" | "error" = "success";
  let description = "Your payment has been processed successfully.";

  try {
    const { stripe } = await import("@/lib/stripe/client");
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      status = "error";
      description =
        "Your payment could not be completed. Please try again or contact support.";
    }
  } catch {
    status = "error";
    description = "Unable to verify your payment. It may still be processing.";
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          {status === "success" && (
            <CheckCircle2Icon className="mx-auto size-10 text-green-500" />
          )}
          <CardTitle className="text-xl">
            {status === "success" ? "Payment Successful" : "Payment Issue"}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" && (
            <p className="text-sm text-muted-foreground">
              Your credits and plan have been updated.
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Button render={<Link href="/billing" />}>
            Back to Billing
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
