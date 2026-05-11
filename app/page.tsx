"use client";

import { Desktop } from "@/components/Desktop";
import { Taskbar } from "@/components/Taskbar";

export default function OSPage() {
  return (
    <main 
      className="fixed inset-0 overflow-hidden bg-black text-white font-sans selection:bg-blue-500/30 touch-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Desktop />
      <Taskbar />
    </main>
  );
}
