// ============================================================
// Panel de guardado/carga de layouts de mapa + gestion de carpetas.
// Extraido de CombatMap.tsx (popover del boton "Mapas"): logica
// autocontenida sin relacion con el grid/drag/herramientas.
// ============================================================

import { useMemo, useState } from 'react';
import type { MapLayout } from '../../utils/layoutPatterns';

interface MapLayoutsPanelProps {
  savedLayouts: MapLayout[];
  folders: { id: string; name: string }[];
  mapTemplates: { id: string; name: string; description: string }[];
  onSaveLayout: (name: string, folderId?: string) => void;
  onLoadLayout: (id: string) => void;
  onDeleteLayout: (id: string) => void;
  onSetMapFolder: (id: string, folderId: string | null) => void;
  onCreateFolder: (name: string) => string;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRandomLayout: (templateId?: string) => void;
  onExportLayouts: () => void;
  onImportLayouts: () => void;
}

export const MapLayoutsPanel = ({
  savedLayouts,
  folders,
  mapTemplates,
  onSaveLayout,
  onLoadLayout,
  onDeleteLayout,
  onSetMapFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onRandomLayout,
  onExportLayouts,
  onImportLayouts,
}: MapLayoutsPanelProps) => {
  const [layoutName, setLayoutName] = useState('');
  const [layoutSel, setLayoutSel] = useState('');
  const [layoutSaveFolder, setLayoutSaveFolder] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [moveFolder, setMoveFolder] = useState('');
  const [templateSel, setTemplateSel] = useState('');

  // Opciones del selector de layouts, agrupadas por carpeta (sin carpeta + cada carpeta).
  const layoutGroups = useMemo(() => {
    const orphan = savedLayouts.filter((l) => !l.folderId || !folders.some((f) => f.id === l.folderId));
    const grouped = folders
      .map((f) => ({
        folder: f,
        items: savedLayouts.filter((l) => l.folderId === f.id),
      }))
      .filter((g) => g.items.length > 0);
    return { orphan, grouped };
  }, [savedLayouts, folders]);

  return (
            <div className="absolute left-0 top-full z-50 mt-1 w-80 max-w-[90vw] rounded-dnd-lg border border-dnd-leather/40 bg-dnd-ink p-4 shadow-xl">
              <div className="mb-3 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-dnd-muted">Guardar actual</span>
                <div className="flex gap-2">
                  <input
                    className="input h-8 min-w-0 flex-1 text-sm"
                    placeholder="Nombre del layout"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSaveLayout(layoutName, layoutSaveFolder || undefined);
                        setLayoutName('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onSaveLayout(layoutName, layoutSaveFolder || undefined);
                      setLayoutName('');
                    }}
                    className="rounded-md bg-dnd-gold px-3 py-1 text-xs font-bold text-dnd-ink hover:bg-dnd-gold/80"
                  >
                    Guardar
                  </button>
                </div>
                {folders.length > 0 && (
                  <select
                    className="input h-8 w-full text-xs"
                    value={layoutSaveFolder}
                    onChange={(e) => setLayoutSaveFolder(e.target.value)}
                    aria-label="Carpeta al guardar"
                  >
                    <option value="">📂 Sin carpeta</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onExportLayouts}
                  className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-400 flex-1"
                >
                  📤 Exportar
                </button>
                <button
                  type="button"
                  onClick={onImportLayouts}
                  className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-400 flex-1"
                >
                  📥 Importar
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-dnd-muted">Guardados ({savedLayouts.length})</span>
                {savedLayouts.length === 0 ? (
                  <span className="text-xs text-dnd-muted">Aún no hay layouts guardados.</span>
                ) : (
                  <>
                    <select
                      className="input h-8 w-full text-sm"
                      value={layoutSel}
                      onChange={(e) => setLayoutSel(e.target.value)}
                    >
                      <option value="">— Elegir —</option>
                      {layoutGroups.orphan.length > 0 && (
                        <optgroup label="📂 Sin carpeta">
                          {layoutGroups.orphan.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name} ({(l.tiles?.length ?? l.barriers?.length ?? 0)} celdas)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {layoutGroups.grouped.map((g) => (
                        <optgroup key={g.folder.id} label={`📁 ${g.folder.name}`}>
                          {g.items.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name} ({(l.tiles?.length ?? l.barriers?.length ?? 0)} celdas)
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (layoutSel) onLoadLayout(layoutSel);
                        }}
                        disabled={!layoutSel}
                        className="rounded-md bg-emerald-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-emerald-400 disabled:opacity-40"
                      >
                        Cargar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (layoutSel) {
                            onDeleteLayout(layoutSel);
                            setLayoutSel('');
                          }
                        }}
                        disabled={!layoutSel}
                        className="rounded-md bg-red-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-red-400 disabled:opacity-40"
                      >
                        Borrar
                      </button>
                      <button
                        type="button"
                        onClick={() => onRandomLayout()}
                        className="rounded-md bg-violet-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-violet-400"
                      >
                        🎲 Aleatorio
                      </button>
                    </div>
                    <select
                      className="input h-8 w-full text-xs"
                      value={templateSel}
                      onChange={(e) => setTemplateSel(e.target.value)}
                      aria-label="Patrón de mapa"
                    >
                      <option value="">— Patrón concreto —</option>
                      {mapTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (templateSel) {
                          onRandomLayout(templateSel);
                          setTemplateSel('');
                        }
                      }}
                      disabled={!templateSel}
                      className="rounded-md bg-fuchsia-600 px-2 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500 disabled:opacity-40"
                    >
                      Generar patrón
                    </button>
                    <select
                      className="input h-8 w-full text-xs"
                      value={moveFolder}
                      onChange={(e) => setMoveFolder(e.target.value)}
                      aria-label="Carpeta de destino para mover la selección"
                    >
                      <option value="">📂 Mover selección a… sin carpeta</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          📁 {f.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (layoutSel) {
                          onSetMapFolder(layoutSel, moveFolder || null);
                          setMoveFolder('');
                          setLayoutSel('');
                        }
                      }}
                      disabled={!layoutSel}
                      className="rounded-md bg-slate-600 px-2 py-1.5 text-xs font-bold text-white hover:bg-slate-500 disabled:opacity-40"
                    >
                      {moveFolder ? 'Mover a carpeta' : 'Quitar de carpeta'}
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-1.5 border-t border-dnd-leather/20 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-dnd-muted">Carpetas</span>
                <div className="flex gap-2">
                  <input
                    className="input h-8 min-w-0 flex-1 text-sm"
                    placeholder="Nueva carpeta (p. ej. Campaña A)"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onCreateFolder(newFolderName);
                        setNewFolderName('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onCreateFolder(newFolderName);
                      setNewFolderName('');
                    }}
                    className="rounded-md bg-dnd-gold px-3 py-1 text-xs font-bold text-dnd-ink hover:bg-dnd-gold/80"
                  >
                    Crear
                  </button>
                </div>
                {folders.length === 0 ? (
                  <span className="text-xs text-dnd-muted">Sin carpetas. Crea una para agrupar tus mapas.</span>
                ) : (
                  <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
                    {folders.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-2 rounded-md bg-dnd-leather/10 px-2 py-1"
                      >
                        <span className="min-w-0 truncate text-xs text-dnd-text">📁 {f.name}</span>
                        <div className="flex shrink-0 gap-1">
                          <input
                            defaultValue={f.name}
                            aria-label={`Renombrar ${f.name}`}
                            onBlur={(e) => {
                              if (e.target.value.trim() && e.target.value !== f.name) {
                                onRenameFolder(f.id, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                            className="input h-6 w-24 px-1 text-[11px]"
                          />
                          <button
                            type="button"
                            title={`Eliminar carpeta ${f.name}`}
                            onClick={() => onDeleteFolder(f.id)}
                            className="rounded bg-red-500/80 px-1.5 text-[11px] font-bold text-white hover:bg-red-400"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
  );
};
