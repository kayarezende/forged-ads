"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/app/actions/settings";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = confirmation === "DELETE";

  async function handleDelete() {
    if (!confirmed) return;
    setDeleting(true);
    setError(null);

    const result = await deleteAccount();
    // If we get here, redirect failed
    if (result?.error) {
      setDeleting(false);
      setError(result.error);
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setConfirmation("");
            setError(null);
          }
        }}>
          <DialogTrigger
            render={
              <Button variant="destructive">
                <Trash2 data-icon="inline-start" className="size-3.5" />
                Delete Account
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Your profile will be permanently
                deactivated and your data will no longer be accessible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label htmlFor="confirm-delete">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!confirmed || deleting}
              >
                {deleting ? "Deleting\u2026" : "Delete My Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
