"use client";

import React, { useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Window } from '@/components/Window';
import { cn } from '@/lib/utils';
import { SYSTEM_APPS } from '@/config/apps';
import { AppDrawer } from '@/components/AppDrawer';

import { BrowserApp } from '@/components/BrowserApp';
import { FilesApp } from '@/components/FilesApp';
import { WeatherApp } from '@/components/WeatherApp';

// Simple counter to ensure unique IDs across launches
let appLaunchCounter = 0;

export function Desktop() {
  const { activeApps, openApp, desktopShortcuts, removeDesktopShortcut } = useStore();
  const desktopRef = useRef<HTMLDivElement>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, show: boolean, targetId?: string }>({ x: 0, y: 0, show: false });

  const handleContextMenu = (e: React.MouseEvent, targetId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Quick adjustment to make sure the menu doesn't overflow
    let x = e.clientX;
    let y = e.clientY;
    
    // Approximate menu dimensions
    if (x + 200 > window.innerWidth) x = window.innerWidth - 200;
    if (y + 300 > window.innerHeight) y = window.innerHeight - 300;

    setContextMenu({ x, y, show: true, targetId });
  };

  const closeContextMenu = () => {
    if (contextMenu.show) {
      setContextMenu({ ...contextMenu, show: false });
    }
  };

  const handleLaunchApp = (appInfo: { id: string, title: string, icon: React.ReactNode }) => {
    let component = null;
    let width = 800;
    let height = 600;

    // A simple registry of component contents based on ID
    if (appInfo.id === 'browser') {
      component = <BrowserApp />;
    } else if (appInfo.id === 'files') {
      component = <FilesApp />;
    } else if (appInfo.id === 'weather') {
      component = <WeatherApp />;
      width = 800;
      height = 600;
    } else if (appInfo.id === 'terminal') {
      component = (
        <div className="w-full h-full bg-slate-900 border-none p-2 font-mono text-xs sm:text-sm text-green-400 flex flex-col">
          <div className="mb-2">
            Nebula OS [Version 1.0.0]<br/>
            (c) System. All rights reserved.
          </div>
          <div className="flex">
            <span className="mr-2">user@nebula:~$</span>
            <span className="animate-pulse w-2 h-4 bg-green-400 inline-block"></span>
          </div>
        </div>
      );
      width = 600;
      height = 400;
    } else if (appInfo.id === 'calculator') {
      component = (
        <div className="w-full h-full flex items-center justify-center p-8 bg-white dark:bg-zinc-900">
          <div className="w-full max-w-[300px] h-full flex flex-col gap-2">
            <div className="w-full h-20 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-end justify-end p-4 text-4xl mb-4 font-light">
              0
            </div>
            <div className="grid grid-cols-4 gap-2 flex-1">
              {['C','+/-','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='].map((btn, i) => (
                <button key={i} className={cn(
                   "rounded-lg flex items-center justify-center text-lg active:scale-95 transition-transform",
                   btn === '0' ? "col-span-2 aspect-auto" : "aspect-square",
                   ['/','*','-','+','='].includes(btn) ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
                )}>
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      width = 300;
      height = 450;
    } else {
      component = (
        <div className="w-full h-full flex items-center justify-center flex-col gap-3 bg-white dark:bg-zinc-900">
          <div className="opacity-20 transform scale-150 mb-4">{appInfo.icon}</div>
          <div className="text-xl font-medium">{appInfo.title}</div>
          <div className="text-sm text-gray-400">Content loading...</div>
        </div>
      );
    }

    appLaunchCounter++;
    
    // Check screen size
    const isMobile = window.innerWidth <= 768;
    // Bound the window size to the screen size (minus some margin for taskbar)
    const finalWidth = isMobile ? window.innerWidth : Math.min(width, window.innerWidth - 40);
    const finalHeight = isMobile ? window.innerHeight - 48 : Math.min(height, window.innerHeight - 100);

    openApp({
      id: `${appInfo.id}_${appLaunchCounter}`, // Allow multiple instances for now by making id unique
      title: appInfo.title,
      icon: appInfo.icon,
      component,
      defaultWidth: finalWidth,
      defaultHeight: finalHeight,
      isMaximized: isMobile
    });
  };

  return (
    <div 
      ref={desktopRef}
      className="absolute inset-0 overflow-hidden z-0 bg-[#020617]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 0% 0%, rgba(59,130,246,0.15) 0, transparent 50%),
          radial-gradient(circle at 100% 100%, rgba(168,85,247,0.15) 0, transparent 50%)
        `
      }}
      onContextMenu={(e) => handleContextMenu(e)}
      onClick={closeContextMenu}
    >
      {/* Desktop Grid for icons */}
      <div className="absolute top-6 left-6 flex flex-col gap-8 flex-wrap content-start max-h-full pb-32">
        {desktopShortcuts.map(shortcutId => {
          const app = SYSTEM_APPS.find(a => a.id === shortcutId);
          if (!app) return null;
          return (
          <button
            key={app.id}
            onContextMenu={(e) => handleContextMenu(e, app.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleLaunchApp(app);
            }}
            // Touch handling for mobile: tap once to open
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleLaunchApp(app);
            }}
            className="w-[80px] group relative flex flex-col items-center gap-2 cursor-pointer outline-none"
          >
            <div className="w-[54px] h-[54px] bg-white/[0.08] backdrop-blur-[10px] border border-white/[0.15] rounded-xl flex items-center justify-center text-2xl group-hover:bg-white/[0.15] group-active:scale-95 transition-all text-white">
              {React.cloneElement(app.icon as React.ReactElement<{size?: number}>, { size: 24 })}
            </div>
            <span className="text-[12px] font-medium text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-white w-full break-words leading-tight">
              {app.title}
            </span>
          </button>
        )})}
      </div>

      {/* Render Active Windows */}
      {activeApps.map(app => (
        <Window key={app.id} app={app} />
      ))}

      {/* Custom Context Menu */}
      {contextMenu.show && (
        <div 
          className="absolute z-[99999] w-48 py-1 rounded-xl bg-slate-900/70 backdrop-blur-[24px] border border-white/[0.15] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col text-sm text-white"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.targetId ? (
            <>
              <button 
                onClick={() => {
                  const targetApp = SYSTEM_APPS.find(a => a.id === contextMenu.targetId);
                  if (targetApp) handleLaunchApp(targetApp);
                  closeContextMenu();
                }}
                className="px-4 py-1.5 text-left hover:bg-white/10 transition-colors w-full text-white"
              >
                Open
              </button>
              <button 
                onClick={() => {
                  if (contextMenu.targetId) removeDesktopShortcut(contextMenu.targetId);
                  closeContextMenu();
                }}
                className="px-4 py-1.5 text-left hover:bg-red-500/80 hover:text-white transition-colors w-full mt-1 text-red-300"
              >
                Remove shortcut
              </button>
            </>
          ) : (
            <>
              <button className="px-4 py-1.5 text-left hover:bg-white/10 transition-colors w-full text-white">View</button>
              <button className="px-4 py-1.5 text-left hover:bg-white/10 transition-colors w-full text-white">Sort by</button>
              <button className="px-4 py-1.5 text-left hover:bg-white/10 transition-colors w-full mb-1 text-white">Refresh</button>
              <div className="h-px bg-white/10 mx-2 my-1" />
              <button className="px-4 py-1.5 text-left hover:bg-blue-500 hover:text-white transition-colors w-full mt-1 text-white">Personalize...</button>
            </>
          )}
        </div>
      )}

      {/* App Drawer */}
      <AppDrawer onLaunch={handleLaunchApp} />
    </div>
  );
}
