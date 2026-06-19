"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SlideOver } from "@/components/ui/slide-over";
import { addClaimNote, listClaimNotes, type ArNote } from "@/lib/claims";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

export function ArNotesPanel({ claimId }: { claimId: string }) {
  const { can } = useAuth();
  const canEdit = can("claims.edit");
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<ArNote[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setNotes(await listClaimNotes(claimId));
    } catch {
      // non-fatal — panel just shows empty
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const value = text.trim();
    if (!value) return;
    setSaving(true);
    try {
      await addClaimNote(claimId, value);
      setText("");
      await load();
      toast.success("Note added.");
    } catch {
      toast.error("Failed to add note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="size-4" /> AR Notes
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs tabular-nums text-zinc-600">
          {notes.length}
        </span>
      </Button>

      <SlideOver
        open={open}
        onOpenChange={setOpen}
        title="AR Notes"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
            {canEdit && (
              <Button
                type="button"
                onClick={add}
                disabled={saving || !text.trim()}
              >
                {saving ? "Adding…" : "Add Note"}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {canEdit && (
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Add a note…"
            />
          )}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm text-zinc-500">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-md border border-zinc-200 p-3 text-sm"
                >
                  <p className="whitespace-pre-wrap text-zinc-800">
                    {note.noteText}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {note.user.firstName} {note.user.lastName} ·{" "}
                    {formatDate(note.noteDate)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </SlideOver>
    </>
  );
}
