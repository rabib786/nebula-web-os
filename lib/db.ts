import Database from '@tauri-apps/plugin-sql';

const DB_NAME = 'sqlite:nebula.db';
let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  db = await Database.load(DB_NAME);
  return db;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  color_tag: string;
  updated_at: number;
}

export interface Todo {
  id: string;
  task: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority?: string;
  due_date?: string;
  created_at: number;
}

// --- Notes API ---

export async function getNotes(): Promise<Note[]> {
  const db = await getDb();
  const rawNotes = await db.select<any[]>('SELECT * FROM notes ORDER BY updated_at DESC');
  return rawNotes.map((n: any) => ({
    ...n,
    is_pinned: Boolean(n.is_pinned),
  }));
}

export async function createNote(note: Note): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO notes (id, title, content, is_pinned, color_tag, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [note.id, note.title, note.content, note.is_pinned ? 1 : 0, note.color_tag, note.updated_at]
  );
}

export async function updateNote(note: Note): Promise<void> {
  const db = await getDb();
  await db.execute(
    'UPDATE notes SET title = $1, content = $2, is_pinned = $3, color_tag = $4, updated_at = $5 WHERE id = $6',
    [note.title, note.content, note.is_pinned ? 1 : 0, note.color_tag, note.updated_at, note.id]
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM notes WHERE id = $1', [id]);
}

// --- Todos API ---

export async function getTodos(): Promise<Todo[]> {
  const db = await getDb();
  return await db.select<Todo[]>('SELECT * FROM todos ORDER BY created_at DESC');
}

export async function createTodo(todo: Todo): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO todos (id, task, status, priority, due_date, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [todo.id, todo.task, todo.status, todo.priority || null, todo.due_date || null, todo.created_at]
  );
}

export async function updateTodo(todo: Todo): Promise<void> {
  const db = await getDb();
  await db.execute(
    'UPDATE todos SET task = $1, status = $2, priority = $3, due_date = $4 WHERE id = $5',
    [todo.task, todo.status, todo.priority || null, todo.due_date || null, todo.id]
  );
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM todos WHERE id = $1', [id]);
}
