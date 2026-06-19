"use client";

import { useRouter } from "next/navigation";

import { formatMoney } from "@/lib/format";
import type { ClientBalance } from "@/lib/dashboard";
import { DashCard } from "./dash-card";

export function TopClientsCard({ data }: { data: ClientBalance[] }) {
  const router = useRouter();
  const max = Math.max(...data.map((c) => c.outstanding), 1);

  return (
    <DashCard title="Top Clients by Balance">
      {data.length === 0 ? (
        <p className="text-sm text-zinc-400">No outstanding balances.</p>
      ) : (
        <div className="space-y-1">
          {data.map((client) => (
            <button
              key={client.clientName}
              type="button"
              onClick={() => router.push("/clients")}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-zinc-50"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">
                {client.clientName}
              </span>
              <span className="relative flex w-28 justify-end overflow-hidden rounded">
                <span
                  className="absolute inset-y-0 right-0 rounded bg-zinc-100"
                  style={{ width: `${(client.outstanding / max) * 100}%` }}
                />
                <span className="relative px-1 font-mono text-sm tabular-nums text-zinc-900">
                  {formatMoney(client.outstanding)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </DashCard>
  );
}
