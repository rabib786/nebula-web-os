"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { ChevronUp, Wifi, Battery, Volume2, Search, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function Taskbar() {
  const { activeApps, minimizeApp, focusApp, highestZIndex, toggleAppDrawer } = useStore();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 h-[64px] w-auto min-w-max md:min-w-[500px] bg-white/[0.05] backdrop-blur-[20px] border border-white/[0.15] rounded-[20px] flex items-center justify-between px-3 z-[1000] select-none text-white shadow-2xl">
      
      {/* Start Button & Search - Left Side */}
      <div className="flex items-center gap-2 h-full py-2">
        <button 
          onClick={toggleAppDrawer}
          className="w-[44px] h-[44px] rounded-[10px] bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors group"
          title="Start"
        >
          <LayoutGrid className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
        </button>
        
        <div className="hidden sm:flex relative ml-1 items-center h-[44px]">
          <div className="absolute left-2.5 flex items-center justify-center pointer-events-none">
            <Search className="w-4 h-4 text-white/50" />
          </div>
          <input 
            type="text" 
            readOnly 
            placeholder="Search" 
            className="h-full w-48 bg-white/10 border border-white/5 rounded-[10px] pl-8 pr-3 text-sm outline-none placeholder:text-white/50 cursor-pointer hover:bg-white/15 transition-colors"
          />
        </div>
      </div>

      {/* Active Apps - Center Area */}
      <div className="flex-1 flex items-center justify-center h-full py-2 overflow-hidden px-4 gap-2">
        {activeApps.map(app => {
          const isFocused = !app.isMinimized && app.zIndex === highestZIndex;
          return (
            <button
              key={app.id}
              onClick={() => {
                if (isFocused) {
                  minimizeApp(app.id);
                } else {
                  focusApp(app.id);
                }
              }}
              className={cn(
                "relative h-[44px] min-w-[44px] sm:min-w-[120px] px-2 flex items-center gap-2 rounded-[10px] transition-all duration-200 border",
                isFocused 
                  ? "bg-white/10 border-transparent shadow-sm" 
                  : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5",
                app.isMinimized && "opacity-70"
              )}
            >
              <div className="w-full flex items-center justify-center gap-2">
                {app.icon && <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">{app.icon}</span>}
                <span className="text-sm truncate hidden sm:block font-medium drop-shadow-sm">
                  {app.title}
                </span>
              </div>
              {/* Indicator dot for open apps (like MacOS/Windows 11) */}
              {(!app.isMinimized || app.isMinimized) && (
                <div className={cn(
                  "absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all",
                  isFocused ? "bg-white" : "bg-white/40 group-hover:bg-white/60"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* System Tray & Clock - Right Side */}
      <div className="flex items-center gap-2 h-full py-2 justify-end ml-auto pl-3 border-l border-white/[0.15]">
        <button className="w-[32px] h-[32px] hidden sm:flex items-center justify-center hover:bg-white/10 rounded-md transition-colors">
          <ChevronUp className="w-4 h-4 text-white/80" />
        </button>
        
        <div className="flex items-center h-[44px] px-2 gap-3 hover:bg-white/10 rounded-[10px] transition-colors cursor-pointer text-white/60 font-medium text-[12px]">
          <div className="hidden md:flex items-center gap-3">
            <Wifi className="w-4 h-4" />
            <Volume2 className="w-4 h-4" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        <button className="h-[44px] px-3 flex flex-col items-end justify-center hover:bg-white/10 rounded-[10px] transition-colors">
          <span className="text-[12px] font-medium leading-tight text-white">
            {time ? format(time, 'HH:mm') : '--:--'}
          </span>
          <span className="text-[10px] text-white/60 leading-tight">
            {time ? format(time, 'MMM d, yyyy') : '---'}
          </span>
        </button>
      </div>
    </div>
  );
}
