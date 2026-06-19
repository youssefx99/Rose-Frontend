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
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-green-600" />
          <p className="text-sm font-medium text-green-800">
            Review queue is clear
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">
                {pendingReviewCount} item
                {pendingReviewCount === 1 ? "" : "s"} pending review
              </p>
              <p className="text-xs text-zinc-500">
                Unreviewed items block payment posting
              </p>
            </div>
          </div>
          <Link
            href="/review"
            className="mt-3 inline-block text-sm font-medium text-rose-500 hover:text-rose-600"
          >
            Go to Review Queue →
          </Link>
        </div>
      )}

      {/* Unmatched deposits */}
      {depositsClear ? (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-green-600" />
          <p className="text-sm font-medium text-green-800">
            All deposits matched
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="mt-0.5 size-5 shrink-0 text-blue-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">
                {unmatchedDeposits.count} unmatched deposit
                {unmatchedDeposits.count === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-zinc-500">
                {formatMoney(unmatchedDeposits.totalAmount)} total
              </p>
            </div>
          </div>
          <Link
            href="/remittances"
            className="mt-3 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            View Deposits →
          </Link>
        </div>
      )}
    </div>
  );
}
