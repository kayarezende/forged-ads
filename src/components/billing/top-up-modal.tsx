"use client";

import { TOPUP_PACKAGES } from "@/lib/constants";
import { createTopUpCheckout } from "@/app/actions/billing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";

export function TopUpModal() {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <PlusIcon data-icon="inline-start" />
        Buy Credits
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy Credits</DialogTitle>
          <DialogDescription>
            Credits are added to your balance immediately after purchase.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {TOPUP_PACKAGES.map((pkg, index) => (
            <form key={index} action={createTopUpCheckout.bind(null, index)}>
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-0">
                  <div>
                    <p className="font-medium font-mono">
                      {pkg.credits} credits
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${(pkg.price / pkg.credits).toFixed(2)}/credit
                    </p>
                  </div>
                  <Button type="submit" size="sm">
                    ${pkg.price}
                  </Button>
                </CardContent>
              </Card>
            </form>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
