"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addPolicy,
  listPolicies,
  removePolicy,
  POLICY_TYPES,
  type Client,
  type InsurancePolicy,
  type PolicyType,
} from "@/lib/clients";
import { listPayers, type Payer } from "@/lib/payers";
import { isAxiosError } from "axios";

interface PoliciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function PoliciesDialog({
  open,
  onOpenChange,
  client,
}: PoliciesDialogProps) {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [payers, setPayers] = useState<Payer[]>([]);
  const [payerId, setPayerId] = useState("");
  const [policyType, setPolicyType] = useState<PolicyType>("PRIMARY");
  const [memberId, setMemberId] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async (clientId: string) => {
    const [policyList, payerResult] = await Promise.all([
      listPolicies(clientId),
      listPayers(),
    ]);
    setPolicies(policyList);
    setPayers(payerResult.data);
  }, []);

  useEffect(() => {
    if (!open || !client) return;
    setPayerId("");
    setPolicyType("PRIMARY");
    setMemberId("");
    reload(client.id).catch(() => toast.error("Failed to load policies."));
  }, [open, client, reload]);

  const handleAdd = async () => {
    if (!client) return;
    if (!payerId) {
      toast.error("Select a payer.");
      return;
    }
    setSaving(true);
    try {
      await addPolicy(client.id, {
        payerId,
        policyType,
        memberId: memberId || undefined,
      });
      toast.success("Policy added.");
      setPayerId("");
      setMemberId("");
      setPolicyType("PRIMARY");
      await reload(client.id);
    } catch (error) {
      const message =
        isAxiosError(error) && error.response?.status === 409
          ? "That policy type already exists for this payer."
          : "Failed to add policy.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (policy: InsurancePolicy) => {
    if (!client) return;
    try {
      await removePolicy(client.id, policy.id);
      toast.success("Policy removed.");
      await reload(client.id);
    } catch {
      toast.error("Failed to remove policy.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insurance Policies</DialogTitle>
          <DialogDescription>
            {client ? client.displayName : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No policies attached yet.
            </p>
          ) : (
            policies.map((policy) => (
              <div
                key={policy.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{policy.payer.name}</span>
                    <Badge variant="secondary">{policy.policyType}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {policy.memberId
                      ? `Member ${policy.memberId}`
                      : "No member ID"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(policy)}
                  aria-label="Remove policy"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Add policy</p>
          <div className="space-y-2">
            <Label>Payer</Label>
            <Select value={payerId} onValueChange={setPayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a payer" />
              </SelectTrigger>
              <SelectContent>
                {payers.map((payer) => (
                  <SelectItem key={payer.id} value={payer.id}>
                    {payer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={policyType}
                onValueChange={(value) => setPolicyType(value as PolicyType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POLICY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberId">Member ID</Label>
              <Input
                id="memberId"
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={saving} className="w-full">
            {saving ? "Adding…" : "Add Policy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
