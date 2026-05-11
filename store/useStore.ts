import { create } from 'zustand';
import React from 'react';

export interface AppWindow {
  id: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  icon?: React.ReactNode;
  component?: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
}

interface OsState {
  activeApps: AppWindow[];
  highestZIndex: number;
  openApp: (app: Omit<AppWindow, 'isMinimized' | 'zIndex'> & { isMaximized?: boolean }) => void;
  closeApp: (id: string) => void;
  minimizeApp: (id: string) => void;
  maximizeApp: (id: string) => void;
  focusApp: (id: string) => void;
  isAppDrawerOpen: boolean;
  toggleAppDrawer: () => void;
  closeAppDrawer: () => void;
  desktopShortcuts: string[];
  addDesktopShortcut: (id: string) => void;
  removeDesktopShortcut: (id: string) => void;
}

export const useStore = create<OsState>((set, get) => ({
  activeApps: [],
  highestZIndex: 10,
  isAppDrawerOpen: false,
  desktopShortcuts: [],
  toggleAppDrawer: () => set((state) => ({ isAppDrawerOpen: !state.isAppDrawerOpen })),
  closeAppDrawer: () => set({ isAppDrawerOpen: false }),
  addDesktopShortcut: (id) => set((state) => ({
    desktopShortcuts: state.desktopShortcuts.includes(id) 
      ? state.desktopShortcuts 
      : [...state.desktopShortcuts, id]
  })),
  removeDesktopShortcut: (id) => set((state) => ({
    desktopShortcuts: state.desktopShortcuts.filter(shortcut => shortcut !== id)
  })),
  openApp: (appInfo) => {
    const { activeApps, highestZIndex, focusApp } = get();
    
    // If the app is already open, just focus it
    if (activeApps.find(app => app.id === appInfo.id)) {
      focusApp(appInfo.id);
      return;
    }

    // Otherwise, open it with the highest z-index
    const newZIndex = highestZIndex + 1;
    set({
      activeApps: [
        ...activeApps,
        {
          ...appInfo,
          isMinimized: false,
          isMaximized: appInfo.isMaximized || false,
          zIndex: newZIndex
        }
      ],
      highestZIndex: newZIndex
    });
  },
  closeApp: (id) => set((state) => ({ 
    activeApps: state.activeApps.filter(app => app.id !== id) 
  })),
  minimizeApp: (id) => set((state) => ({
    activeApps: state.activeApps.map(app => 
      app.id === id ? { ...app, isMinimized: !app.isMinimized } : app
    )
  })),
  maximizeApp: (id) => set((state) => {
    const newZIndex = state.highestZIndex + 1;
    return {
      highestZIndex: newZIndex,
      activeApps: state.activeApps.map(app => 
        app.id === id ? { ...app, isMaximized: !app.isMaximized, zIndex: newZIndex } : app
      )
    };
  }),
  focusApp: (id) => set((state) => {
    // Only update if it's not already the top window OR if it's minimized
    const targetApp = state.activeApps.find(a => a.id === id);
    if (targetApp && targetApp.zIndex === state.highestZIndex && !targetApp.isMinimized) {
      return state;
    }

    const newZIndex = state.highestZIndex + 1;
    return {
      highestZIndex: newZIndex,
      activeApps: state.activeApps.map(app => 
        app.id === id ? { ...app, zIndex: newZIndex, isMinimized: false } : app
      )
    };
  })
}));
