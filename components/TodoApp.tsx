import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle2, Circle, GripVertical, Trash2 } from 'lucide-react';
import { Reorder, AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { getTodos, createTodo as createTodoDb, updateTodo as updateTodoDb, deleteTodo as deleteTodoDb, Todo } from '@/lib/db';

type TodoStatus = 'Pending' | 'In Progress' | 'Completed';

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load data from SQLite
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const savedTodos = await getTodos();
        setTodos(savedTodos || []);
      } catch (error) {
        console.error("Failed to load todos from DB", error);
      }
    };
    loadTodos();
  }, []);

  const addTodo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      task: newTaskText.trim(),
      status: 'Pending',
      due_date: newTaskDeadline || undefined,
      created_at: Date.now()
    };

    try {
      await createTodoDb(newTodo);
      setTodos(prev => [newTodo, ...prev]);
      setNewTaskText('');
      setNewTaskDeadline('');
      setIsAdding(false);
    } catch (err) {
      console.error("Failed to create todo", err);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await deleteTodoDb(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Failed to delete todo", err);
    }
  };

  const toggleStatus = async (id: string) => {
    const todoToUpdate = todos.find(t => t.id === id);
    if (!todoToUpdate) return;

    let nextStatus: TodoStatus = 'Pending';
    if (todoToUpdate.status === 'Pending') nextStatus = 'In Progress';
    else if (todoToUpdate.status === 'In Progress') nextStatus = 'Completed';
    else if (todoToUpdate.status === 'Completed') nextStatus = 'Pending';

    const updatedTodo = { ...todoToUpdate, status: nextStatus };

    try {
      await updateTodoDb(updatedTodo);
      setTodos(prev => prev.map(t => (t.id === id ? updatedTodo : t)));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const renderSection = (title: string, status: TodoStatus) => {
    const sectionTodos = (todos || []).filter(t => t.status === status);

    return (
      <div className="mb-8 bg-black/20 rounded-2xl p-4 border border-white/5">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 tracking-wider uppercase flex items-center gap-2">
          {title}
          <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs text-slate-300">
            {sectionTodos.length}
          </span>
        </h3>

        <Reorder.Group
          axis="y"
          values={sectionTodos}
          onReorder={(newOrder) => {
            // Merge reordered items back into main list
            const otherTodos = todos.filter(t => t.status !== status);
            setTodos([...otherTodos, ...newOrder]);
          }}
          className="space-y-2 min-h-[50px]"
        >
          <AnimatePresence>
            {sectionTodos.map(todo => (
              <Reorder.Item
                key={todo.id}
                value={todo}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl bg-white/5 border transition-colors group cursor-grab active:cursor-grabbing",
                  todo.status === 'Completed' ? "border-transparent opacity-60" : "border-white/10 hover:border-white/20 hover:bg-white/10"
                )}
              >
                <button
                  onClick={() => toggleStatus(todo.id)}
                  className="shrink-0 text-slate-400 hover:text-blue-400 transition-colors"
                >
                  {todo.status === 'Completed' ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : todo.status === 'In Progress' ? (
                    <Clock size={20} className="text-blue-400" />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>

                <div className="flex-1 min-w-0 overflow-hidden relative">
                  <span className={cn(
                    "block truncate transition-all duration-300",
                    todo.status === 'Completed' && "text-slate-500"
                  )}>
                    {todo.task}
                  </span>
                  {/* Hardware accelerated strikethrough animation */}
                  <div className={cn(
                    "absolute top-1/2 left-0 h-[1.5px] bg-emerald-400/80 transition-all duration-300 ease-out origin-left",
                    todo.status === 'Completed' ? "w-full scale-x-100" : "w-0 scale-x-0"
                  )} />

                  {todo.due_date && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Calendar size={10} />
                      {new Date(todo.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} />
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-transparent text-white overflow-hidden flex flex-col font-sans">
      <div className="h-16 shrink-0 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl flex items-center px-6 justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Tasks</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium",
            isAdding ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
          )}
        >
          <Plus size={16} className={cn("transition-transform duration-300", isAdding && "rotate-45")} />
          {isAdding ? "Cancel" : "New Task"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-900/40 backdrop-blur-md custom-scrollbar">
        <div className="max-w-3xl mx-auto">

          <AnimatePresence>
            {isAdding && (
              <motion.form
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                onSubmit={addTodo}
                className="bg-black/40 border border-blue-500/30 rounded-2xl p-4 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              >
                <input
                  autoFocus
                  type="text"
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-transparent text-lg text-white outline-none placeholder:text-slate-500 mb-4"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                    <Calendar size={14} />
                    <input
                      type="date"
                      value={newTaskDeadline}
                      onChange={e => setNewTaskDeadline(e.target.value)}
                      className="bg-transparent text-sm outline-none text-slate-300"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newTaskText.trim()}
                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {renderSection('Pending', 'Pending')}
          {renderSection('In Progress', 'In Progress')}
          {renderSection('Completed', 'Completed')}

        </div>
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
