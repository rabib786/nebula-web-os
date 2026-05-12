"use client";

import { Desktop } from "@/components/Desktop";
import { Taskbar } from "@/components/Taskbar";
import { TitleBar } from "@/components/TitleBar";

export default function OSPage() {
  return (
    <main 
      className="fixed inset-0 overflow-hidden bg-black text-white font-sans selection:bg-blue-500/30 touch-none pt-[36px]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <TitleBar />
      <Desktop />
      <Taskbar />
    </main>
  );
}
