// ============================================================
// Slice de sesión: chat/lore y flujo de tiradas pedidas a jugadores.
// Parte de useCombatStore (ver combatStore.ts) — comparte set/get
// con los demás slices (core, map).
// ============================================================

import type { StateCreator } from 'zustand';
import type { ChatMessage, RollRequest, RollResponse, PendingEncounter } from '../types';
import { sortByInitiative } from '../utils/combatUtils';
import { makeId, STAT_LABELS, emitInitiativeRequest } from './combatStore.helpers';
import type { CombatStore } from './combatStore';
import { useCombatStore } from './combatStore';

export type SessionSlice = Pick<
  CombatStore,
  | 'chat'
  | 'rollRequest'
  | 'rollResponses'
  | 'sendChatMessage'
  | 'clearChat'
  | 'requestRoll'
  | 'receiveRollResponse'
  | 'cancelRollRequest'
  | 'finalizeEncounter'
  | 'cancelPendingEncounter'
>;

export const createSessionSlice: StateCreator<CombatStore, [], [], SessionSlice> = (set, get) => ({
  chat: [],
  rollRequest: null,
  rollResponses: [],

  sendChatMessage: (msg) => {
    const { chat } = get();
    const full: ChatMessage = {
      ...msg,
      id: makeId(),
      timestamp: Date.now(),
    };
    set({ chat: [...chat, full].slice(-200) });
    get().addLogEntry({
      type: 'chat',
      message: `🗣 ${msg.author}: ${msg.text}`,
      combatantId: msg.combatantId,
      details: { author: msg.author, kind: msg.kind },
    });
  },

  clearChat: () => {
    const removed = get().chat.length;
    set({ chat: [] });
    get().addLogEntry({
      type: 'custom',
      message: `🗑 Chat/lore vaciado (${removed} mensaje${removed === 1 ? '' : 's'} eliminado${removed === 1 ? '' : 's'})`,
    });
  },

  requestRoll: (request) => {
    const full: RollRequest = { ...request, id: makeId(), createdAt: Date.now() };
    set({ rollRequest: full });
    const ctx = full.label ? ` — ${full.label}` : '';
    let msg: string;
    if (full.kind === 'save') {
      msg = `🎲 Petición de salvación (${STAT_LABELS[full.ability!]}) a ${full.playerName}: DC ${full.dc}${ctx}`;
    } else if (full.kind === 'initiative') {
      msg = `🎲 Petición de iniciativa a ${full.playerName}${ctx}`;
    } else {
      const opts = (full.skills ?? []).join(', ');
      msg = `🎲 Petición de habilidad a ${full.playerName}${opts ? ` (elige: ${opts})` : ''}${full.dc ? ` · DC ${full.dc}` : ''}${ctx}`;
    }
    get().addLogEntry({ type: 'roll', message: msg });
  },

  receiveRollResponse: (response: RollResponse) => {
    const existing = get().rollResponses ?? [];
    const already = existing.some((r) => r.requestId === response.requestId);
    if (already) return;
    // Guarda la respuesta y cierra la petición vigente.
    set({ rollResponses: [...existing, response], rollRequest: null });

    if (response.kind === 'save') {
      get().addLogEntry({
        type: 'roll',
        message:
          `🎲 ${response.playerName} (${STAT_LABELS[response.ability!]}) → ${response.breakdown} ` +
          `${response.success ? '✔ ÉXITO' : '✖ FALLO'} (DC ${response.dc})`,
      });
      return;
    }

    if (response.kind === 'skill') {
      const sk = response.skill ?? 'habilidad';
      const total = response.breakdown;
      const outcome =
        response.dc !== undefined
          ? `${response.success ? '✔ ÉXITO' : '✖ FALLO'} (DC ${response.dc})`
          : `total ${response.result}`;
      get().addLogEntry({
        type: 'roll',
        message: `🎲 ${response.playerName} — ${sk} → ${total} · ${outcome}`,
      });
      return;
    }

    // initiative: aplica el resultado y sigue la cascada o finaliza.
    if (response.kind === 'initiative') {
      const pen = get().pendingEncounter;
      get().addLogEntry({
        type: 'roll',
        message: `🎲 ${response.playerName} — ${response.breakdown} → iniciativa ${response.initiative ?? response.result}`,
      });
      if (!pen) return;
      const init = response.initiative ?? response.result;
      const withRoll = pen.participants.map((p) =>
        p.type === 'player' && p.name === response.playerName ? { ...p, initiative: init } : p
      );
      const nextNames = pen.pendingNames.filter((n) => n !== response.playerName);
      set({ pendingEncounter: { ...pen, participants: withRoll, pendingNames: nextNames, currentName: nextNames[0] ?? null } });
      if (nextNames.length === 0) {
        useCombatStore.getState().finalizeEncounter();
      } else {
        emitInitiativeRequest(get().pendingEncounter as PendingEncounter);
      }
      return;
    }
  },

  cancelRollRequest: () => {
    const current = get().rollRequest;
    if (!current) return;
    set({ rollRequest: null });
    get().addLogEntry({
      type: 'roll',
      message: `✖ Petición de tirada cancelada (${current.playerName})`,
    });
  },

  finalizeEncounter: () => {
    const pen = get().pendingEncounter;
    if (!pen) return;
    const sorted = sortByInitiative(pen.participants);
    const names = sorted.map((c) => `${c.name} (${c.initiative})`);
    set({
      id: pen.id,
      round: 1,
      turn: -1,
      isActive: true,
      participants: sorted,
      pendingEncounter: null,
      rollRequest: null,
      startTime: new Date(),
      encounterCount: (get().encounterCount ?? 0) + 1,
      xpAwards: [],
    });
    get().addLogEntry({
      type: 'initiative',
      message: `¡Encuentro iniciado! Iniciativa: ${names.join(', ')}`,
    });
  },

  cancelPendingEncounter: () => {
    const pen = get().pendingEncounter;
    if (!pen) return;
    const names = pen.pendingNames.join(', ');
    set({ pendingEncounter: null, rollRequest: null });
    get().addLogEntry({
      type: 'initiative',
      message: `✖ Encuentro cancelado (iniciativas pendientes: ${names})`,
    });
  },
});
