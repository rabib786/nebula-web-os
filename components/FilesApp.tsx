"use client";

import React, { useState, useEffect } from 'react';
import { Folder, HardDrive, HardDriveDownload, Cloud, LogIn, File, FileText, Image as ImageIcon, Loader2, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

type FileItem = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
};

export function FilesApp() {
  const [providerToken, setProviderToken] = useState<{google?: string, dropbox?: string}>({});
  const [currentProvider, setCurrentProvider] = useState<'local' | 'google' | 'dropbox'>('local');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [localFiles, setLocalFiles] = useState<FileItem[]>([
    { id: '1', name: 'Documents', type: 'folder' },
    { id: '2', name: 'Images', type: 'folder' },
    { id: '3', name: 'readme.txt', type: 'file', size: 1024 },
    { id: '4', name: 'hello.js', type: 'file', size: 256 },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'object' && event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { provider, token } = event.data;
        if (token && token !== 'undefined') {
          setProviderToken(prev => ({ ...prev, [provider]: token }));
        } else {
          alert(`Failed to receive token from ${provider}. Make sure OAuth is properly configured.`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCreateFolder = async () => {
    const folderName = window.prompt('Enter folder name:', 'New Folder');
    if (!folderName) return;

    if (currentProvider === 'local') {
      // eslint-disable-next-line react-hooks/purity
      const newFolder: FileItem = { id: Date.now().toString(), name: folderName, type: 'folder' };
      setLocalFiles(prev => [...prev, newFolder]);
      setFiles(prev => [...prev, newFolder]);
    } else if (currentProvider === 'google' && providerToken.google) {
      setIsLoading(true);
      try {
        const res = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${providerToken.google}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: ['root']
          })
        });
        if (res.ok) {
          fetchGoogleDrive(providerToken.google);
        } else {
          alert('Failed to create folder on Google Drive');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } else if (currentProvider === 'dropbox' && providerToken.dropbox) {
      setIsLoading(true);
      try {
        const res = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${providerToken.dropbox}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: `/${folderName}`,
            autorename: true
          })
        });
        if (res.ok) {
          fetchDropbox(providerToken.dropbox);
        } else {
          alert('Failed to create folder on Dropbox');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleConnect = async (provider: 'google' | 'dropbox') => {
    try {
      const response = await fetch(`/api/auth/url?provider=${provider}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups to connect your account.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching OAuth URL');
    }
  };

  const fetchGoogleDrive = async (token: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,size)&q=' + encodeURIComponent("'root' in parents and trashed=false"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error && data.error.code === 401) {
        setProviderToken(prev => ({ ...prev, google: undefined }));
        return;
      }
      if (data.files) {
        setFiles(data.files.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
          mimeType: f.mimeType,
          size: f.size
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDropbox = async (token: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: "", limit: 50 })
      });
      const data = await res.json();
      if (data.error && data.error.summary.includes('expired_access_token')) {
        setProviderToken(prev => ({ ...prev, dropbox: undefined }));
        return;
      }
      if (data.entries) {
        setFiles(data.entries.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f['.tag'] === 'folder' ? 'folder' : 'file',
          size: f.size
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentProvider === 'local') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiles(localFiles);
    } else if (currentProvider === 'google' && providerToken.google) {
      fetchGoogleDrive(providerToken.google);
    } else if (currentProvider === 'dropbox' && providerToken.dropbox) {
      fetchDropbox(providerToken.dropbox);
    } else {
      setFiles([]);
    }
  }, [currentProvider, providerToken, localFiles]);

  return (
    <div className="w-full h-full flex bg-slate-900/40 text-white">
      {/* Sidebar */}
      <div className="w-48 border-r border-white/10 bg-black/20 p-2 flex flex-col gap-1 shrink-0">
        <div className="text-xs font-semibold text-white/50 px-2 py-2 uppercase tracking-wide">Locations</div>
        <button 
          onClick={() => setCurrentProvider('local')}
          className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors", currentProvider === 'local' ? "bg-blue-500/20 text-blue-300" : "hover:bg-white/5 text-white/80")}
        >
          <HardDrive size={16} /> Local Disk
        </button>
        <button 
          onClick={() => setCurrentProvider('google')}
          className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors", currentProvider === 'google' ? "bg-blue-500/20 text-blue-300" : "hover:bg-white/5 text-white/80")}
        >
          <Cloud size={16} /> Google Drive
        </button>
        <button 
          onClick={() => setCurrentProvider('dropbox')}
          className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors", currentProvider === 'dropbox' ? "bg-blue-500/20 text-blue-300" : "hover:bg-white/5 text-white/80")}
        >
          <HardDriveDownload size={16} /> Dropbox
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (breadcrumb/toolbar) */}
        <div className="h-12 border-b border-white/10 bg-black/10 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm opacity-90 capitalize">
              {currentProvider === 'local' ? 'Local Disk' : currentProvider}
            </span>
            <span className="text-white/40 px-2">/</span>
            <span className="text-sm opacity-70">root</span>
          </div>
          <div className="flex items-center gap-2">
            {((currentProvider === 'local') || (currentProvider === 'google' && providerToken.google) || (currentProvider === 'dropbox' && providerToken.dropbox)) && (
               <button 
                 onClick={handleCreateFolder}
                 className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-sm transition-colors text-white/90"
                 disabled={isLoading}
               >
                 <FolderPlus size={16} /> New Folder
               </button>
            )}
          </div>
        </div>

        {/* File List/Empty States */}
        <div className="flex-1 overflow-auto p-4 flex flex-col">
          {(currentProvider === 'google' && !providerToken.google) || (currentProvider === 'dropbox' && !providerToken.dropbox) ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/70">
              <Cloud size={48} className="mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2 text-white">Connect to {currentProvider === 'google' ? 'Google Drive' : 'Dropbox'}</h3>
              <p className="text-sm mb-6 max-w-sm">
                Authenticate with your {currentProvider === 'google' ? 'Google' : 'Dropbox'} account to browse and use your files directly in Nebula OS.
              </p>
              <button 
                onClick={() => handleConnect(currentProvider as 'google' | 'dropbox')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <LogIn size={16} /> Connect Account
              </button>
              
              <div className="mt-8 bg-black/30 border border-white/10 p-4 rounded-lg text-left text-xs text-white/60 w-full max-w-sm">
                <strong>Config Required:</strong><br/>
                Add the following env vars in AI Studio Settings:<br/>
                - {currentProvider.toUpperCase()}_CLIENT_ID<br/>
                - {currentProvider.toUpperCase()}_CLIENT_SECRET
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-blue-400" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-white/40">
              Empty folder
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4 content-start">
              {files.map(file => (
                <div key={file.id} className="flex flex-col items-center gap-2 p-3 hover:bg-white/10 rounded-lg cursor-pointer group transition-colors text-center">
                  {file.type === 'folder' ? (
                    <Folder size={40} className="text-blue-400 group-hover:scale-105 transition-transform" />
                  ) : file.mimeType?.startsWith('image/') ? (
                    <ImageIcon size={40} className="text-purple-400 group-hover:scale-105 transition-transform" />
                  ) : file.name.endsWith('.txt') || file.mimeType?.includes('text') ? (
                    <FileText size={40} className="text-slate-300 group-hover:scale-105 transition-transform" />
                  ) : (
                    <File size={40} className="text-slate-300 group-hover:scale-105 transition-transform" />
                  )}
                  <span className="text-xs break-words w-full opacity-90 line-clamp-2" title={file.name}>
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
