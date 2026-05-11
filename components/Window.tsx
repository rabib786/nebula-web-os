"use client";

import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Minus, Square, X, Copy } from 'lucide-react';
import { useStore, AppWindow } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface WindowProps {
  app: AppWindow;
}

export function Window({ app }: WindowProps) {
  const { closeApp, minimizeApp, maximizeApp, focusApp } = useStore();
  
  // Track window dimensions when max/restoring
  const [size, setSize] = useState({ width: app.defaultWidth || 600, height: app.defaultHeight || 400 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize random position on client-side to avoid hydration warnings and purity issues
  useEffect(() => {
    if (!isInitialized) {
      const randomOffsetX = Math.floor(Math.random() * 40 - 20);
      const randomOffsetY = Math.floor(Math.random() * 40 - 20);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosition({ 
        x: window.innerWidth / 2 - (app.defaultWidth || 600) / 2 + randomOffsetX, 
        y: window.innerHeight / 2 - (app.defaultHeight || 400) / 2 + randomOffsetY 
      });
      setIsInitialized(true);
    }
  }, [app.defaultWidth, app.defaultHeight, isInitialized]);

  // If component mounts and is not full screen, trigger focus to make sure it's on top
  useEffect(() => {
    focusApp(app.id);
  }, [app.id, focusApp]);

  // Handled inherently by the Rnd size/position props logic
  // no state update needed here.

  if (app.isMinimized) return null;

  return (
    <Rnd
      size={app.isMaximized ? { width: '100%', height: 'calc(100% - 48px)' } : size}
      position={app.isMaximized ? { x: 0, y: 0 } : position}
      onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSize({ width: parseInt(ref.style.width), height: parseInt(ref.style.height) });
        setPosition(position);
      }}
      minWidth={320}
      minHeight={200}
      bounds={app.isMaximized ? undefined : "parent"}
      dragHandleClassName="window-drag-handle"
      cancel=".window-controls"
      disableDragging={app.isMaximized}
      enableResizing={!app.isMaximized}
      style={{ zIndex: app.zIndex }}
      onMouseDown={() => focusApp(app.id)}
      className={cn(
        "flex flex-col transition-transform duration-200 ease-out",
        app.isMaximized ? "transition-[width,height,transform]" : "rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-white/[0.15]",
        "bg-slate-900/70 backdrop-blur-[24px]"
      )}
    >
      {/* Custom Title Bar */}
      <div 
        className={cn(
          "window-drag-handle h-[40px] flex items-center justify-between px-4 select-none",
          "bg-white/[0.05] border-b border-white/[0.15] shrink-0",
          "active:cursor-grabbing transition-colors"
        )}
        onDoubleClick={() => maximizeApp(app.id)}
      >
        {/* Window Controls (Left) */}
        <div className="window-controls flex items-center gap-2 z-10 shrink-0 group/controls" onPointerDown={(e) => e.stopPropagation()}>
          <button 
            className="w-3 h-3 rounded-full flex items-center justify-center bg-[#fb7185] text-transparent hover:text-black/50 transition-colors"
            onClick={(e) => { e.stopPropagation(); closeApp(app.id); }}
            title="Close"
          >
            <X size={8} strokeWidth={3} />
          </button>
          <button 
            className="w-3 h-3 rounded-full flex items-center justify-center bg-[#fbbf24] text-transparent hover:text-black/50 transition-colors"
            onClick={(e) => { e.stopPropagation(); minimizeApp(app.id); }}
            title="Minimize"
          >
            <Minus size={8} strokeWidth={3} />
          </button>
          <button 
            className="w-3 h-3 rounded-full flex items-center justify-center bg-[#4ade80] text-transparent hover:text-black/50 transition-colors"
            onClick={(e) => { e.stopPropagation(); maximizeApp(app.id); }}
            title="Maximize"
          >
            {app.isMaximized ? <Copy size={7} strokeWidth={3} className="rotate-180" /> : <Square size={7} strokeWidth={3} />}
          </button>
        </div>

        {/* Title (Center-ish / Right) */}
        <div className="flex items-center gap-2 overflow-hidden ml-4 mr-auto">
          {app.icon && <span className="text-white/60 w-4 h-4">{app.icon}</span>}
          <span className="text-[13px] font-semibold font-mono tracking-wide text-white/60 truncate pr-4">
            {app.title}
          </span>
        </div>
        
        {/* Spacer for flex-between balance if needed */}
        <div className="w-[52px]"></div>
      </div>
      
      {/* Window Content */}
      <div className="flex-1 overflow-hidden relative break-words bg-transparent flex flex-col text-sm text-white">
        {app.component}
      </div>
    </Rnd>
  );
}
