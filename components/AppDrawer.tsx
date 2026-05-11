"use client";

import React, { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { SYSTEM_APPS } from '@/config/apps';

export function AppDrawer({ onLaunch }: { onLaunch: (appInfo: any) => void }) {
  const { isAppDrawerOpen, closeAppDrawer, desktopShortcuts, addDesktopShortcut, removeDesktopShortcut } = useStore();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, show: boolean, targetId?: string }>({ x: 0, y: 0, show: false });
  const drawerRef = useRef<HTMLDivElement>(null);

  if (!isAppDrawerOpen) return null;

  const handleContextMenu = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!drawerRef.current) return;
    
    const rect = drawerRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // Bounds checking relative to the drawer
    if (x + 192 > rect.width) x = rect.width - 192; // 192px is w-48
    if (y + 100 > rect.height) y = rect.height - 100;

    setContextMenu({ x, y, show: true, targetId });
  };

  const closeContextMenu = () => {
    if (contextMenu.show) {
      setContextMenu({ ...contextMenu, show: false });
    }
  };

  return (
    <div 
      ref={drawerRef}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] h-[400px] z-[999] bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl p-6 flex flex-col"
      onClick={(e) => {
        e.stopPropagation();
        closeContextMenu();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        closeContextMenu();
      }}
    >
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-white text-xl font-semibold">All Apps</h2>
        <div className="text-white/50 text-sm">Select an app to launch</div>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-y-8 gap-x-4 overflow-y-auto custom-scrollbar content-start flex-1">
        {SYSTEM_APPS.map(app => (
          <div key={app.id} className="flex flex-col items-center gap-2 group relative">
            <button
              onClick={() => {
                onLaunch(app);
                closeAppDrawer();
              }}
              onContextMenu={(e) => handleContextMenu(e, app.id)}
              className="w-14 h-14 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl flex items-center justify-center text-white transition-all transform group-hover:scale-105"
            >
              <div className="scale-150 relative pointer-events-none">
                {app.icon}
              </div>
            </button>
            <span className="text-xs text-white/80 group-hover:text-white text-center font-medium px-1 truncate w-full pointer-events-none">
              {app.title}
            </span>
          </div>
        ))}
      </div>

      {/* App Drawer Context Menu */}
      {contextMenu.show && contextMenu.targetId && (
        <div 
          className="absolute z-[1000] w-48 py-1 rounded-xl bg-slate-900/90 backdrop-blur-[24px] border border-white/[0.15] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col text-sm text-white"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {desktopShortcuts.includes(contextMenu.targetId) ? (
            <button 
              onClick={() => {
                removeDesktopShortcut(contextMenu.targetId!);
                closeContextMenu();
              }}
              className="px-4 py-1.5 text-left hover:bg-red-500/80 hover:text-white transition-colors w-full text-red-300"
            >
              Remove from Desktop
            </button>
          ) : (
            <button 
              onClick={() => {
                addDesktopShortcut(contextMenu.targetId!);
                closeContextMenu();
              }}
              className="px-4 py-1.5 text-left hover:bg-white/10 transition-colors w-full text-white"
            >
              Add to Desktop
            </button>
          )}
        </div>
      )}
    </div>
  );
}
