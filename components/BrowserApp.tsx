"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Wifi, WifiOff, RefreshCw, ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrowserApp() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleConnect = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsOnline(navigator.onLine);
      setIsChecking(false);
      
      if (!navigator.onLine) {
        alert("Your actual device is offline. Please connect to the internet.");
      }
    }, 1500);
  };

  const [urlInput, setUrlInput] = useState('nebula://start');
  const [history, setHistory] = useState<string[]>(['nebula://start']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [startSearch, setStartSearch] = useState('');

  const currentUrl = history[historyIndex];

  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);

  useEffect(() => {
    if (currentUrl === 'nebula://start') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHtmlContent(null);
      return;
    }

    let isMounted = true;
    setIsLoadingHtml(true);

    const fetchContent = async () => {
      try {
        const isTauri = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
        
        if (isTauri) {
          // @ts-ignore
          const invoke = window.__TAURI_INTERNALS__?.invoke || window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
          if (invoke) {
            const html = await invoke('fetch_html', { url: currentUrl });
            if (isMounted) {
               const baseUrl = new URL(currentUrl).origin;
               const baseTag = `<base href="${baseUrl}/">`;
               let finalHtml = html as string;
               if (finalHtml.includes('<head>')) {
                 finalHtml = finalHtml.replace('<head>', `<head>${baseTag}`);
               } else {
                 finalHtml = `<head>${baseTag}</head>${finalHtml}`;
               }
               setHtmlContent(finalHtml);
            }
          } else {
             if (isMounted) setHtmlContent(null);
          }
        } else {
          if (isMounted) setHtmlContent(null);
        }
      } catch (e) {
        if (isMounted) {
          setHtmlContent(`<html><body><div style="font-family:sans-serif;padding:2rem;"><h1>Failed to load</h1><p style="color:red;">${String(e)}</p></div></body></html>`);
        }
      } finally {
        if (isMounted) setIsLoadingHtml(false);
      }
    };

    fetchContent();

    return () => { isMounted = false; };
  }, [currentUrl]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrlInput(currentUrl);
  }, [currentUrl]);

  const navigateTo = React.useCallback((url: string) => {
    let finalUrl = url.trim();
    if (!finalUrl) return;
    
    if (finalUrl !== 'nebula://start' && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if ((finalUrl.includes('.') || finalUrl.startsWith('localhost') || finalUrl.includes(':')) && !finalUrl.includes(' ')) {
        if (finalUrl.startsWith('localhost')) {
          finalUrl = `http://${finalUrl}`;
        } else {
          finalUrl = `https://${finalUrl}`;
        }
      } else {
        // Use bing for search as it tends to be slightly more iframe-friendly than Google in some regions
        finalUrl = `https://www.bing.com/search?q=${encodeURIComponent(finalUrl)}`;
      }
    }
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(finalUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'NEBULA_BROWSER_NAV' && e.data?.url) {
        navigateTo(e.data.url);
      } else if (e.data?.type === 'NEBULA_BROWSER_LOADED' && e.data?.url) {
        // If the URL changed due to a redirect
        if (e.data.url !== currentUrl) {
           const newHistory = history.map((url, i) => i === historyIndex ? e.data.url : url);
           setHistory(newHistory);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [historyIndex, history, currentUrl, navigateTo]);

  const handleBack = () => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  };

  const handleReload = () => {
    const iframe = document.getElementById('browser-iframe') as HTMLIFrameElement;
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => { iframe.src = currentSrc; }, 10);
    }
  };

  const handleHome = () => navigateTo('nebula://start');

  const handleAddressBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(urlInput);
  };

  const handleStartSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(startSearch);
  };

  if (!isOnline) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <WifiOff size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-zinc-800 dark:text-zinc-100">You are offline</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
          The web browser is not connected to a network. Connect to a network to surf the web.
        </p>
        
        <button 
          onClick={handleConnect}
          disabled={isChecking}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {isChecking ? (
            <><RefreshCw size={16} className="animate-spin" />Connecting...</>
          ) : (
            <><Wifi size={16} />Connect to Network</>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-50 flex-1">
      {/* Top Address Bar area */}
      <div className="h-12 border-b flex items-center px-2 bg-gray-100 dark:bg-zinc-200 text-gray-800 gap-1 shrink-0">
        <div className="flex gap-1 shrink-0">
          <button 
            onClick={handleBack}
            disabled={historyIndex === 0}
            className="w-8 h-8 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-300 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <button 
            onClick={handleForward}
            disabled={historyIndex === history.length - 1}
            className="w-8 h-8 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-300 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Forward"
          >
            <ArrowRight size={16} />
          </button>
          <button 
            onClick={handleReload}
            className="w-8 h-8 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-300 flex items-center justify-center transition-colors"
            title="Reload"
          >
            <RefreshCw size={14} />
          </button>
          <button 
            onClick={handleHome}
            className="w-8 h-8 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-300 flex items-center justify-center transition-colors ml-1"
            title="Home"
          >
            <Home size={16} />
          </button>
        </div>
        
        <form onSubmit={handleAddressBarSubmit} className="flex-1 mx-2 shrink min-w-0" noValidate>
          <div className="bg-white dark:bg-zinc-100 h-8 rounded-full px-4 text-xs flex items-center shadow-inner border border-gray-200/50 hover:border-blue-400/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden relative">
            <Globe size={12} className="text-gray-400 mr-2 shrink-0" />
            <input 
              type="url" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 outline-none bg-transparent min-w-0 truncate"
              onFocus={(e) => e.target.select()}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
        </form>
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative bg-white flex flex-col min-h-0">
        {currentUrl === 'nebula://start' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-black bg-zinc-50 overflow-y-auto w-full">
            <div className="flex flex-col items-center max-w-lg w-full mb-16">
              <h1 className="text-4xl font-bold mb-8 text-zinc-800 tracking-tight flex items-center gap-3">
                <Globe className="text-blue-500" size={40} /> Nebula Edge
              </h1>
              <form onSubmit={handleStartSearchSubmit} className="w-full bg-white border border-gray-200 rounded-full px-5 flex items-center shadow-sm h-12 hover:shadow-md focus-within:shadow-md focus-within:border-blue-400 transition-all" noValidate>
                <input 
                  type="url" 
                  className="flex-1 outline-none text-zinc-800 bg-transparent text-sm" 
                  placeholder="Search the web or type a URL..." 
                  value={startSearch}
                  onChange={(e) => setStartSearch(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </form>
              <div className="mt-8 grid grid-cols-4 gap-4 w-full">
                {[
                  { name: 'Wikipedia', url: 'https://en.wikipedia.org' },
                  { name: 'Example', url: 'https://example.com' },
                  { name: 'React', url: 'https://react.dev' },
                  { name: 'Bing', url: 'https://www.bing.com' },
                ].map(site => (
                  <button 
                    key={site.name}
                    onClick={() => navigateTo(site.url)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-500">
                      {site.name[0]}
                    </div>
                    <span className="text-xs text-gray-600 truncate w-full text-center">{site.name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-12 text-xs text-zinc-400 text-center px-4 bg-zinc-100/50 p-4 rounded-xl border border-zinc-200/50">
                <p className="font-semibold mb-1 text-zinc-500">Notice about Web Browsers in OS Simulators:</p>
                To bypass X-Frame-Options and CORS restrictions, this browser leverages a <b>backend proxy</b>. While this allows Wikipedia, Bing, and static sites to load, complex Single Page Applications (like YouTube or Google) may still fail due to strict Content Security Policies, JavaScript CORS errors, or cookie restrictions that cannot be completely masked by a simple proxy.
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex-1 relative bg-white">
            {isLoadingHtml && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <RefreshCw className="animate-spin text-blue-500" size={24} />
              </div>
            )}
            <iframe 
              id="browser-iframe"
              src={htmlContent ? undefined : `/api/proxy?url=${encodeURIComponent(currentUrl)}`} 
              srcDoc={htmlContent || undefined}
              className="w-full h-full border-none bg-white"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              title="Nebula Edge Browser Frame"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
