import { cn } from "@/lib/utils";

interface DashCardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

/** White card matching the design system (border-zinc-200, shadow-sm, p-6). */
export function DashCard({ title, className, children }: DashCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-6 shadow-sm",
        className,
      )}
    >
      {title && (
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">{title}</h2>
      )}
      {children}
    </div>
  );
}
