"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { TableHead } from "./table";

/**
 * A header cell the user arranges from inside the table: drag it onto another
 * header to reorder, double-click its name to rename it. No toolbar, no dialog.
 */
export function EditableColumnHead({
  columnKey,
  label,
  title,
  className,
  onMove,
  onRename,
}: {
  columnKey: string;
  label: string;
  /** Tooltip explaining the drag/rename gestures. */
  title: string;
  className?: string;
  onMove: (fromKey: string, toKey: string) => void;
  onRename: (key: string, label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  if (editing) {
    const commit = (value: string) => {
      onRename(columnKey, value);
      setEditing(false);
    };
    return (
      <TableHead className={className}>
        <input
          autoFocus
          defaultValue={label}
          aria-label={title}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(e.currentTarget.value);
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full min-w-16 rounded-sm border border-interactive bg-background px-1 py-0.5 type-heading-compact-01 text-text-primary focus:outline-none"
        />
      </TableHead>
    );
  }

  return (
    <TableHead
      draggable
      title={title}
      onDoubleClick={() => setEditing(true)}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", columnKey)}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDropTarget(true);
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDropTarget(false);
        const from = e.dataTransfer.getData("text/plain");
        if (from) onMove(from, columnKey);
      }}
      className={cn(
        "cursor-grab select-none active:cursor-grabbing",
        isDropTarget && "bg-highlight ring-1 ring-inset ring-interactive",
        className,
      )}
    >
      {label}
    </TableHead>
  );
}
