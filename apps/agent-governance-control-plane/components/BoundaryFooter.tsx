import { BOUNDARY_NOTE_AR } from "@/lib/governance-model";

export function BoundaryFooter() {
  return (
    <footer className="border-t border-navy-100 bg-navy-50 px-6 py-4">
      <p className="mx-auto max-w-6xl text-center text-xs leading-relaxed text-navy-500">{BOUNDARY_NOTE_AR}</p>
    </footer>
  );
}
