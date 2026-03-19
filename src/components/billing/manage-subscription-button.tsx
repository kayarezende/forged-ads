"use client";

import { createPortalSession } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";

export function ManageSubscriptionButton() {
  return (
    <form action={createPortalSession}>
      <Button variant="outline" size="sm">
        <ExternalLinkIcon data-icon="inline-start" />
        Manage Subscription
      </Button>
    </form>
  );
}
