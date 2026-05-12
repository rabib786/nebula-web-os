import React from 'react';
import { Terminal, Folder, Globe, Calculator, Settings, CodeSquare, CloudSun } from 'lucide-react';

export const SYSTEM_APPS = [
  { id: 'browser', title: 'Nebula Edge', icon: <Globe size={16} /> },
  { id: 'files', title: 'Files', icon: <Folder size={16} /> },
  { id: 'terminal', title: 'Terminal', icon: <Terminal size={16} /> },
  { id: 'calculator', title: 'Calculator', icon: <Calculator size={16} /> },
  { id: 'weather', title: 'Weather', icon: <CloudSun size={16} /> },
  { id: 'settings', title: 'Settings', icon: <Settings size={16} /> },
  { id: 'editor', title: 'Code Editor', icon: <CodeSquare size={16} /> },
];

export const SYSTEM_APPS_MAP = new Map(SYSTEM_APPS.map(app => [app.id, app]));
