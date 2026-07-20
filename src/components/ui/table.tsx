import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Carbon data table. Header on a gray layer with heading-compact-01 labels;
 * rows separated by subtle horizontal borders; hover/selected use layer tokens;
 * cells are body-compact-01. Status is the only color in a row. See design/08 §9.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-layer [&_tr]:border-b [&_tr]:border-border-subtle", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border-subtle transition-colors hover:bg-layer-hover data-[state=selected]:bg-layer-selected",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "type-heading-compact-01 h-12 px-4 text-start align-middle text-text-secondary whitespace-nowrap [&:has([role=checkbox])]:pe-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "type-body-compact-01 px-4 py-3 align-middle text-text-primary whitespace-nowrap [&:has([role=checkbox])]:pe-0",
        className,
      )}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
