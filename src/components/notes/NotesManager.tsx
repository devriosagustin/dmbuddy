// ============================================================
// Gestor de notas del DM: editor markdown, categorías, búsqueda
// ============================================================

import { useMemo, useState } from 'react';
import {
  CalendarPlus,
  FileText,
  Heart,
  History,
  NotebookPen,
  Plus,
  Search,
  ScrollText,
  Star,
  Trash2,
  Download,
  Upload,
  Eye,
  PenLine,
} from 'lucide-react';
import { Button } from '../common/Button';
import { NOTE_CATEGORIES, SESSION_PREP_TEMPLATE, useNoteStore } from '../../store/noteStore';
import type { Note, NoteCategory } from '../../types';
import { MarkdownPreview } from './MarkdownPreview';
import { CombatLog } from '../combat/CombatLog';
import { QuestManager } from '../quests/QuestManager';

const CATEGORY_ICONS: Record<NoteCategory, string> = {
  Campaign: '📜',
  Session: '🗓️',
  NPCs: '🧙',
  Locations: '🗺️',
};

const CATEGORY_COLORS: Record<NoteCategory, string> = {
  Campaign: 'border-dnd-gold/50 text-dnd-gold',
  Session: 'border-sky-500/50 text-sky-300',
  NPCs: 'border-purple-500/50 text-purple-300',
  Locations: 'border-emerald-500/50 text-emerald-300',
};

/**
 * Pantalla de notas: lista con búsqueda y editor en panel lateral.
 */
export const NotesManager = () => {
  const { notes, addNote, updateNote, removeNote, toggleFavorite, exportNotes, importNotes } = useNoteStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | NoteCategory>('all');
  const [tab, setTab] = useState<'notas' | 'registro' | 'misiones'>('notas');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [previewMode, setPreviewMode] = useState(true);

  const selected: Note | undefined = notes.find((n) => n.id === selectedId);

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (category !== 'all' && n.category !== category) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [notes, category, search]);

  const openNote = (note: Note) => {
    setSelectedId(note.id);
    setDraftTitle(note.title);
    setDraftContent(note.content);
  };

  const createNote = (c: NoteCategory = 'Session') => {
    const note = addNote({
      title: 'Nueva nota',
      content: 'Escribe aquí… usa **markdown** para dar formato.',
      category: c,
      tags: [],
      isFavorite: false,
    });
    setSelectedId(note.id);
    setDraftTitle(note.title);
    setDraftContent(note.content);
  };

  /** Crea una nota de "Sesión" precargada con un esqueleto de preparación. */
  const createSessionNote = () => {
    const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const note = addNote({
      title: `Sesión — ${today}`,
      content: SESSION_PREP_TEMPLATE,
      category: 'Session',
      tags: ['prep'],
      isFavorite: false,
    });
    setSelectedId(note.id);
    setDraftTitle(note.title);
    setDraftContent(note.content);
  };

  const saveDraft = () => {
    if (!selectedId) return;
    updateNote(selectedId, {
      title: draftTitle.trim() || 'Sin título',
      content: draftContent,
    });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    removeNote(selectedId);
    setSelectedId(null);
    setDraftTitle('');
    setDraftContent('');
  };

  const handleExport = () => {
    const blob = new Blob([exportNotes()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dm_copilot_notes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importNotes(String(reader.result));
    };
    reader.readAsText(file);
  };

const selectClass = 'select';

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-3 overflow-hidden">
      <div className="page-header shrink-0">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <NotebookPen size={22} aria-hidden="true" /> Registro y Notas
          </h2>
          <p className="text-sm text-dnd-muted">
            {notes.length} notas · editor Markdown · historial del registro del combate
          </p>
        </div>
        {tab === 'notas' && (
          <div className="page-actions">
            <Button variant="ghost" size="sm" icon={<Download size={15} />} onClick={handleExport}>
              Exportar
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dnd-leather/70 px-2.5 py-1.5 text-xs font-bold text-dnd-text transition-colors hover:bg-dnd-leather/30">
              <Upload size={15} aria-hidden="true" />
              Importar
              <input
                type="file"
                accept="application/json"
                className="sr-only"
                onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button variant="secondary" size="sm" icon={<CalendarPlus size={15} />} onClick={createSessionNote}>
              Nueva sesión
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => createNote()}>
              Nueva nota
            </Button>
          </div>
        )}
      </div>

      {/* Pestañas: Notas y Registro */}
      <div className="flex w-fit shrink-0 gap-1 rounded-lg border border-dnd-leather/40 bg-dnd-ink/40 p-1" role="tablist" aria-label="Registro y notas">
        <button
          role="tab"
          aria-selected={tab === 'notas'}
          onClick={() => setTab('notas')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${tab === 'notas' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'}`}
        >
          <NotebookPen size={15} aria-hidden="true" /> Notas
        </button>
        <button
          role="tab"
          aria-selected={tab === 'registro'}
          onClick={() => setTab('registro')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${tab === 'registro' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'}`}
        >
          <History size={15} aria-hidden="true" /> Registro
        </button>
        <button
          role="tab"
          aria-selected={tab === 'misiones'}
          onClick={() => setTab('misiones')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${tab === 'misiones' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'}`}
        >
          <ScrollText size={15} aria-hidden="true" /> Misiones
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {tab === 'registro' ? (
        <CombatLog defaultExpanded />
      ) : tab === 'misiones' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <QuestManager />
        </div>
      ) : (
      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[320px_1fr]">
        {/* Lista de notas */}
        <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <div className="card shrink-0 space-y-2">
            <div className="relative">
              <label htmlFor="note-search" className="sr-only">Buscar notas</label>
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dnd-muted" aria-hidden="true" />
              <input
                id="note-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en notas, tags…"
                className="input pl-9 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por categoría">
              <button
                onClick={() => setCategory('all')}
                aria-pressed={category === 'all'}
                className={`badge ${category === 'all' ? 'bg-dnd-gold text-dnd-ink' : 'border border-dnd-leather/50 text-dnd-muted hover:text-dnd-text'}`}
              >
                Todas
              </button>
              {NOTE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`badge border ${category === c
                    ? CATEGORY_COLORS[c] + ' bg-dnd-gold/10'
                    : 'border-dnd-leather/50 text-dnd-muted hover:text-dnd-text'}`}
                >
                  {CATEGORY_ICONS[c]} {c}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="card min-h-0 flex-1 space-y-1 overflow-y-auto" role="list" aria-label="Lista de notas">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-dnd-muted">No hay notas que coincidan.</p>
            )}
            {filtered.map((note) => (
              <button
                key={note.id}
                onClick={() => openNote(note)}
                role="listitem"
                aria-selected={selectedId === note.id}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  selectedId === note.id
                    ? 'border-dnd-gold bg-dnd-gold/10'
                    : 'border-transparent hover:bg-dnd-leather/20'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-sm font-bold text-dnd-text">{note.title}</p>
                  {note.isFavorite && <Star size={12} className="shrink-0 text-dnd-gold" aria-label="Favorita" />}
                </div>
                <p className="flex items-center gap-1 truncate text-[11px] text-dnd-muted">
                  {CATEGORY_ICONS[note.category]} {note.category} ·{' '}
                  {new Date(note.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="card flex min-h-0 flex-col overflow-hidden">
          {selected ? (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
              {/* Barra del editor */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selected.category}
                  onChange={(e) => updateNote(selected.id, { category: e.target.value as NoteCategory })}
                  aria-label="Categoría de la nota"
                  className={selectClass}
                >
                  {NOTE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={() => toggleFavorite(selected.id)}
                  aria-pressed={selected.isFavorite}
                  aria-label={selected.isFavorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
                  className={`rounded-lg p-1.5 transition-colors ${selected.isFavorite ? 'text-dnd-gold' : 'text-dnd-muted hover:text-dnd-gold'}`}
                >
                  <Heart size={16} fill={selected.isFavorite ? 'currentColor' : 'none'} />
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => setPreviewMode(false)}
                    aria-pressed={!previewMode}
                    aria-label="Modo edición"
                    className={`rounded-lg p-2 ${!previewMode ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'}`}
                  >
                    <PenLine size={15} />
                  </button>
                  <button
                    onClick={() => setPreviewMode(true)}
                    aria-pressed={previewMode}
                    aria-label="Modo vista previa"
                    className={`rounded-lg p-2 ${previewMode ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'}`}
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={deleteSelected}
                    aria-label="Eliminar nota"
                    className="rounded-lg p-2 text-dnd-muted hover:bg-dnd-blood/30 hover:text-red-300"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Título */}
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={saveDraft}
                aria-label="Título de la nota"
                className="w-full rounded bg-transparent font-fantasy text-xl font-bold text-dnd-text focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold"
                placeholder="Título de la nota…"
              />

              {previewMode ? (
                <div className="min-h-64 rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/40 p-4">
                  <MarkdownPreview content={draftContent} />
                </div>
              ) : (
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  onBlur={saveDraft}
                  aria-label="Contenido de la nota en Markdown"
                  className="min-h-64 w-full resize-y rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/40 p-4 font-body text-sm text-dnd-text focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold"
                  placeholder="# Escribe aquí en Markdown…"
                />
              )}

              {/* Info */}
              <p className="flex items-center justify-between text-[11px] text-dnd-muted">
                <span className="flex items-center gap-1">
                  <FileText size={12} aria-hidden="true" />
                  {selected.category} · Creada {new Date(selected.createdAt).toLocaleDateString('es-ES')}
                </span>
                <span>Modificada {new Date(selected.updatedAt).toLocaleString('es-ES')}</span>
              </p>
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center text-dnd-muted">
              <FileText size={40} aria-hidden="true" />
              <p className="font-fantasy text-lg">Selecciona una nota o crea una nueva</p>
              <p className="text-xs">Soporta markdown: # títulos, **negrita**, - listas, [enlaces](url)</p>
              <Button variant="primary" size="sm" className="mt-2" onClick={() => createNote()} icon={<Plus size={14} />}>
                Crear nota
              </Button>
            </div>
          )}
        </div>
      </div>
      )}
      </div>
    </div>
  );
};

export default NotesManager;
