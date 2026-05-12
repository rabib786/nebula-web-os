import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Pin, Folder, Edit3, Search, Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  category: string;
  updatedAt: number;
}

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['Personal', 'Work', 'Ideas']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load initial (mock) data
  useEffect(() => {
    const savedNotes = localStorage.getItem('nebula-notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    } else {
      setNotes([
        {
          id: '1',
          title: 'Welcome to Notes',
          content: 'This is a high-performance, distraction-free note-taking app.\n\n- Try editing this note.\n- Pin notes to keep them at the top.\n- Organize with categories.',
          pinned: true,
          category: 'Personal',
          updatedAt: Date.now(),
        }
      ]);
    }
  }, []);

  // Simulate Auto-save to Tauri backend
  useEffect(() => {
    if (notes.length === 0) return;

    setIsSaving(true);
    const timeoutId = setTimeout(() => {
      localStorage.setItem('nebula-notes', JSON.stringify(notes));
      // TODO: Replace with Tauri API call: invoke('save_notes', { notes })
      setIsSaving(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [notes]);

  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }
    // Sort: Pinned first, then by newest
    return [...result].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, searchQuery]);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      pinned: false,
      category: categories[0] || 'Uncategorized',
      updatedAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const updateActiveNote = (updates: Partial<Note>) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n =>
      n.id === activeNoteId ? { ...n, ...updates, updatedAt: Date.now() } : n
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n
    ));
  };

  const extractTitle = (content: string) => {
    const firstLine = content.split('\n')[0].trim();
    return firstLine.length > 0 ? firstLine.substring(0, 50) : 'Untitled Note';
  };

  return (
    <div className="w-full h-full flex bg-transparent text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950/80 backdrop-blur-2xl border-r border-white/10 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight text-white">Notes</h2>
            <button
              onClick={createNote}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-slate-200 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={cn(
                "w-full text-left p-3 rounded-xl cursor-pointer transition-all group flex flex-col gap-1 border",
                activeNoteId === note.id
                  ? "bg-blue-500/20 border-blue-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                  : "bg-transparent border-transparent hover:bg-white/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={cn(
                  "font-medium truncate text-sm",
                  activeNoteId === note.id ? "text-blue-100" : "text-slate-200"
                )}>
                  {note.title}
                </span>
                <button
                  onClick={(e) => togglePin(note.id, e)}
                  className={cn(
                    "shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                    note.pinned ? "opacity-100 text-blue-400" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Pin size={14} className={note.pinned ? "fill-current" : ""} />
                </button>
              </div>
              <div className="text-xs text-slate-500 truncate">
                {new Date(note.updatedAt).toLocaleDateString()} - {note.content.substring(0, 30) || "No additional text"}
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="text-center text-slate-500 text-sm mt-8">
              No notes found.
            </div>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 bg-slate-900/40 backdrop-blur-md flex flex-col relative">
        {activeNote ? (
          <>
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-black/20">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium px-2 py-1 bg-white/5 rounded-md text-slate-300 border border-white/5">
                  {activeNote.category}
                </span>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  {isSaving ? (
                    <><Save size={12} className="animate-pulse" /> Saving...</>
                  ) : (
                    <><Check size={12} /> Saved</>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteNote(activeNote.id)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Delete note"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => updateActiveNote({ title: e.target.value })}
                className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-slate-700 mb-6"
                placeholder="Note Title"
              />
              <textarea
                value={activeNote.content}
                onChange={(e) => {
                  const content = e.target.value;
                  // Optional: Auto-update title based on first line if title is default
                  if (activeNote.title === 'Untitled Note' || activeNote.title === extractTitle(activeNote.content)) {
                    updateActiveNote({ content, title: extractTitle(content) });
                  } else {
                    updateActiveNote({ content });
                  }
                }}
                className="w-full h-[calc(100%-60px)] bg-transparent text-slate-300 outline-none resize-none placeholder:text-slate-600 leading-relaxed"
                placeholder="Start typing..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
              <Edit3 size={24} className="text-slate-400" />
            </div>
            <p>Select a note or create a new one</p>
            <button
              onClick={createNote}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors border border-blue-500/30"
            >
              Create Note
            </button>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
