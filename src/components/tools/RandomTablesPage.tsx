// ============================================================
// Generador aleatorio: nombres de NPC, ganchos de aventura,
// complicaciones y botín. Tablas curadas a mano (sin IA) — ver
// src/data/randomTables.ts.
// ============================================================

import { useState } from 'react';
import { Check, Copy, Dices, Save, ScrollText, Skull, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { useNoteStore } from '../../store/noteStore';
import { NPC_NAME_TABLES } from '../../data/randomTables';
import type { LootTier } from '../../data/randomTables';
import { LOOT_TIER_LABELS } from '../../data/randomTables';
import { rollAdventureHook, rollComplication, rollLoot, rollNpcName } from '../../utils/randomTables';
import type { RolledLoot, RolledNpcName } from '../../utils/randomTables';

/** Copia texto al portapapeles y devuelve si funcionó (puede fallar sin permisos). */
const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/** Botón de copiar con feedback breve ("¡Copiado!"). */
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleClick = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <Button variant="ghost" size="sm" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={handleClick}>
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  );
};

/**
 * Pantalla del generador aleatorio: 4 tablas independientes con su propio
 * botón de tirada, copiar y guardar como nota.
 */
export const RandomTablesPage = () => {
  const addNote = useNoteStore((s) => s.addNote);

  const [npcSpecies, setNpcSpecies] = useState('');
  const [npcResult, setNpcResult] = useState<RolledNpcName | null>(null);

  const [hookResult, setHookResult] = useState<string | null>(null);
  const [complicationResult, setComplicationResult] = useState<string | null>(null);

  const [lootTier, setLootTier] = useState<LootTier>('bajo');
  const [lootResult, setLootResult] = useState<RolledLoot | null>(null);

  const saveNote = (title: string, content: string, category: 'NPCs' | 'Campaign' | 'Session') => {
    addNote({ title, content, category, tags: ['generador aleatorio'], isFavorite: false });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h2 className="page-title">Generador aleatorio</h2>
        <p className="text-sm text-dnd-muted">
          Tablas propias de la app (no texto del SRD), pensadas para acortar la prep de sesión sin depender de IA:
          tirá y adaptá el resultado a tu campaña.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Nombres de NPC */}
        <section className="section-box space-y-3">
          <h3 className="flex items-center gap-1.5 section-title">
            <Sparkles size={14} aria-hidden="true" /> Nombre de NPC
          </h3>
          <div>
            <label htmlFor="rt-species" className="label">Especie (opcional)</label>
            <select
              id="rt-species"
              className="input text-sm"
              value={npcSpecies}
              onChange={(e) => setNpcSpecies(e.target.value)}
            >
              <option value="">Al azar entre todas</option>
              {NPC_NAME_TABLES.map((t) => (
                <option key={t.speciesId} value={t.speciesId}>{t.speciesLabel}</option>
              ))}
            </select>
          </div>
          <Button icon={<Dices size={16} />} onClick={() => setNpcResult(rollNpcName(npcSpecies || undefined))}>
            {npcResult ? 'Tirar otra vez' : 'Tirar nombre'}
          </Button>
          {npcResult && (
            <div className="rounded-lg bg-dnd-ink/40 p-3">
              <p className="font-bold text-dnd-text">{npcResult.name}</p>
              <p className="text-[11px] text-dnd-muted">{npcResult.speciesLabel}</p>
              <div className="mt-2 flex gap-2">
                <CopyButton text={npcResult.name} />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Save size={14} />}
                  onClick={() => saveNote(npcResult.name, `Especie: ${npcResult.speciesLabel}`, 'NPCs')}
                >
                  Guardar en notas
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Ganchos de aventura */}
        <section className="section-box space-y-3">
          <h3 className="flex items-center gap-1.5 section-title">
            <ScrollText size={14} aria-hidden="true" /> Gancho de aventura
          </h3>
          <Button
            icon={<Dices size={16} />}
            onClick={() => setHookResult(rollAdventureHook(hookResult ?? undefined))}
          >
            {hookResult ? 'Tirar otro' : 'Tirar gancho'}
          </Button>
          {hookResult && (
            <div className="rounded-lg bg-dnd-ink/40 p-3">
              <p className="text-sm text-dnd-text">{hookResult}</p>
              <div className="mt-2 flex gap-2">
                <CopyButton text={hookResult} />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Save size={14} />}
                  onClick={() => saveNote('Gancho de aventura', hookResult, 'Campaign')}
                >
                  Guardar en notas
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Complicaciones */}
        <section className="section-box space-y-3">
          <h3 className="flex items-center gap-1.5 section-title">
            <Skull size={14} aria-hidden="true" /> Complicación de escena
          </h3>
          <Button
            icon={<Dices size={16} />}
            onClick={() => setComplicationResult(rollComplication(complicationResult ?? undefined))}
          >
            {complicationResult ? 'Tirar otra' : 'Tirar complicación'}
          </Button>
          {complicationResult && (
            <div className="rounded-lg bg-dnd-ink/40 p-3">
              <p className="text-sm text-dnd-text">{complicationResult}</p>
              <div className="mt-2 flex gap-2">
                <CopyButton text={complicationResult} />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Save size={14} />}
                  onClick={() => saveNote('Complicación de escena', complicationResult, 'Session')}
                >
                  Guardar en notas
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Botín */}
        <section className="section-box space-y-3">
          <h3 className="flex items-center gap-1.5 section-title">
            <Sparkles size={14} aria-hidden="true" /> Botín
          </h3>
          <div>
            <label htmlFor="rt-loot-tier" className="label">Nivel de dificultad</label>
            <select
              id="rt-loot-tier"
              className="input text-sm"
              value={lootTier}
              onChange={(e) => setLootTier(e.target.value as LootTier)}
            >
              {(Object.keys(LOOT_TIER_LABELS) as LootTier[]).map((tier) => (
                <option key={tier} value={tier}>{LOOT_TIER_LABELS[tier]}</option>
              ))}
            </select>
          </div>
          <Button icon={<Dices size={16} />} onClick={() => setLootResult(rollLoot(lootTier))}>
            {lootResult ? 'Tirar otra vez' : 'Tirar botín'}
          </Button>
          {lootResult && (
            <div className="rounded-lg bg-dnd-ink/40 p-3">
              <p className="text-sm text-dnd-text">{lootResult.text}</p>
              <p className="mt-1 text-[11px] font-bold text-dnd-gold">+ {lootResult.gold} po</p>
              <div className="mt-2 flex gap-2">
                <CopyButton text={`${lootResult.text} (${lootResult.gold} po)`} />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Save size={14} />}
                  onClick={() =>
                    saveNote('Botín', `${lootResult.text}\n\n${lootResult.gold} piezas de oro.`, 'Session')
                  }
                >
                  Guardar en notas
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RandomTablesPage;
