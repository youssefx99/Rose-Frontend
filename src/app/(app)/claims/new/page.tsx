"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClaimForm } from "../claim-form";
import { useT } from "@/lib/i18n/provider";
import type { Claim } from "@/lib/claims";

export default function NewClaimPage() {
  const router = useRouter();
  const t = useT();

  const handleSaved = (claim: Claim) => {
    router.replace(`/claims/${claim.id}`);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/claims"
        className="inline-flex items-center gap-1 type-body-compact-01 text-text-secondary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />{" "}
        {t("claims.action.backToClaims")}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{t("claims.action.newClaim")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ClaimForm mode="create" onSaved={handleSaved} />
        </CardContent>
      </Card>
    </div>
  );
}
