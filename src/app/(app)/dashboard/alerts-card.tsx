"use client";

import Link from "next/link";
import { CircleCheck, DollarSign, TriangleAlert } from "lucide-react";

import { formatMoney } from "@/lib/format";

interface AlertsCardProps {
  pendingReviewCount: number;
  unmatchedDeposits: { count: number; totalAmount: number };
}

export function AlertsCard({
  pendingReviewCount,
  unmatchedDeposits,
}: AlertsCardProps) {
  const reviewClear = pendingReviewCount === 0;
  const depositsClear = unmatchedDeposits.count === 0;

  return (
    <div className="space-y-4">
      {/* Review queue */}
      {reviewClear ? (
        <div className="flex items-start gap-3 rounded-md border border-support-success bg-support-success-bg p-4">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-support-success" />
          <p className="type-body-compact-01 font-medium text-text-primary">
            Review queue is clear
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-support-warning bg-support-warning-bg p-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-support-warning" />
            <div className="min-w-0">
              <p className="type-body-compact-01 font-semibold text-text-primary">
                {pendingReviewCount} item
                {pendingReviewCount === 1 ? "" : "s"} pending review
              </p>
              <p className="type-label-01 text-text-secondary">
                Unreviewed items block payment posting
              </p>
            </div>
          </div>
          <Link
            href="/review"
            className="mt-3 inline-block type-body-compact-01 font-medium text-link hover:text-link-hover"
          >
            Go to Review Queue →
          </Link>
        </div>
      )}

      {/* Unmatched deposits */}
      {depositsClear ? (
        <div className="flex items-start gap-3 rounded-md border border-support-success bg-support-success-bg p-4">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-support-success" />
          <p className="type-body-compact-01 font-medium text-text-primary">
            All deposits matched
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-support-info bg-support-info-bg p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="mt-0.5 size-5 shrink-0 text-support-info" />
            <div className="min-w-0">
              <p className="type-body-compact-01 font-semibold text-text-primary">
                {unmatchedDeposits.count} unmatched deposit
                {unmatchedDeposits.count === 1 ? "" : "s"}
              </p>
              <p className="type-label-01 text-text-secondary">
                {formatMoney(unmatchedDeposits.totalAmount)} total
              </p>
            </div>
          </div>
          <Link
            href="/remittances"
            className="mt-3 inline-block type-body-compact-01 font-medium text-text-secondary hover:text-text-primary"
          >
            View Deposits →
          </Link>
        </div>
      )}
    </div>
  );
}
