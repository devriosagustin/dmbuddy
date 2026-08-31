// ============================================================
// Store de notas del Dungeon Master (persistido)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, NoteCategory } from '../types';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `n-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

const DEFAULT_SAVE = `# Diario del Dungeon Master

Bienvenido a **DM Copilot Web**.

Escribe aquí tus ideas, NPCs, localizaciones o el resumen de la última sesión usando *Markdown*.

## Ejemplos
- **Negrita** y *cursiva*
- Listas
  - Anidadas
- [Enlaces](https://www.dndbeyond.com)
- > Citas de tus NPCs

¡Que rueden los dados! 🎲
`;

interface NoteStore {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id'>>) => void;
  removeNote: (id: string) => void;
  toggleFavorite: (id: string) => void;
  exportNotes: () => string;
  importNotes: (json: string) => boolean;
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes: [
        {
          id: makeId(),
          title: 'Bienvenido',
          content: DEFAULT_SAVE,
          category: 'Campaign',
          tags: ['bienvenida', 'inicio'],
          createdAt: new Date(),
          updatedAt: new Date(),
          isFavorite: true,
        },
      ],

      addNote: (note) => {
        const now = new Date();
        const newNote: Note = {
          ...note,
          id: makeId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ notes: [newNote, ...state.notes] }));
        return newNote;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? { ...n, ...updates, updatedAt: new Date() }
              : n
          ),
        }));
      },

      removeNote: (id) => {
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isFavorite: !n.isFavorite } : n
          ),
        }));
      },

      exportNotes: () => {
        return JSON.stringify(get().notes, null, 2);
      },

      importNotes: (json) => {
        try {
          const parsed = JSON.parse(json) as Note[];
          if (!Array.isArray(parsed)) return false;
          const valid = parsed.filter(
            (n) => typeof n.title === 'string' && typeof n.content === 'string'
          );
          if (valid.length === 0) return false;
          set({ notes: valid });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'note-storage',
    }
  )
);

// Categorías disponibles para filtrar notas
export const NOTE_CATEGORIES: NoteCategory[] = [
  'Campaign',
  'Session',
  'NPCs',
  'Locations',
];