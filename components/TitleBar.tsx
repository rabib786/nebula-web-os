"use client";

import { useState } from "react";
import { Minus, Square, X, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => {
    // Standard DOM fallback
    document.body.style.display = "none";

    // webOS API
    if (typeof window !== "undefined" && (window as any).webOS && (window as any).webOS.window) {
      // webOS specific minimize logic if available, webOS typically uses close or background
      // There isn't a direct standard 'minimize' in all webOS profiles, but we provide the hook
      if (typeof (window as any).webOS.window.minimize === 'function') {
        (window as any).webOS.window.minimize();
      }
    }
  };

  const handleMaximize = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsMaximized(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsMaximized(false);
    }

    // webOS API
    if (typeof window !== "undefined" && (window as any).webOS && (window as any).webOS.window) {
      if (typeof (window as any).webOS.window.maximize === 'function') {
        (window as any).webOS.window.maximize();
      }
    }
  };

  const handleClose = () => {
    // webOS native close
    if (typeof window !== "undefined" && (window as any).webOS && (window as any).webOS.window) {
      if (typeof (window as any).webOS.window.close === 'function') {
        (window as any).webOS.window.close();
      } else {
        window.close();
      }
    } else {
      // Standard DOM fallback
      window.close();
    }
  };

  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 h-[36px] flex items-center justify-between px-3 z-[10001] select-none",
        "bg-[#050c23]/75 backdrop-blur-[20px] border-b border-white/[0.08]"
      )}
      // Simple custom draggable implementation class for DOM manipulation if wrapper uses it
      className-draggable="nebula-draggable"
    >
      <div className="text-[0.95rem] font-semibold text-white pointer-events-none">
        Nebula WebOS
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={handleMinimize}
          className="w-8 h-6 rounded-md bg-white/[0.08] text-white flex items-center justify-center hover:bg-white/[0.16] transition-colors"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-6 rounded-md bg-white/[0.08] text-white flex items-center justify-center hover:bg-white/[0.16] transition-colors"
          title="Maximize/Restore"
        >
          {isMaximized ? <Copy size={12} className="rotate-180" /> : <Square size={12} />}
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-6 rounded-md bg-white/[0.08] text-white flex items-center justify-center hover:bg-[#ff5f56] transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
