"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { addClaimNote, listClaimNotes, formatDate, type ArNote } from "@/lib/claims";

export function ArNotesPanel({ claimId }: { claimId: string }) {
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
    <Card>
      <CardHeader>
        <CardTitle>AR Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Add a note…"
          />
          <Button size="sm" onClick={add} disabled={saving || !text.trim()}>
            {saving ? "Adding…" : "Add Note"}
          </Button>
        </div>
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-md border p-3 text-sm">
                <p className="whitespace-pre-wrap">{note.noteText}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.user.firstName} {note.user.lastName} ·{" "}
                  {formatDate(note.noteDate)}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
