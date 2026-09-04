// ============================================================
// Tests del store de misiones (bitácora de quests)
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { useQuestStore } from '../store/questStore';

// Reset del estado en memoria (ignora la persistencia en tests)
beforeEach(() => {
  useQuestStore.setState({ quests: [] });
});

describe('Quest Store', () => {
  it('crea una misión con estado por defecto y marcas de tiempo', () => {
    const created = useQuestStore.getState().addQuest({ title: 'Recuperar la corona', status: 'activa' });
    expect(created.title).toBe('Recuperar la corona');
    expect(created.status).toBe('activa');
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
    expect(useQuestStore.getState().quests).toHaveLength(1);
  });

  it('actualiza campos y refresca updatedAt', () => {
    const created = useQuestStore.getState().addQuest({ title: 'Escoltar la caravana', status: 'activa' });
    const originalUpdatedAt = created.updatedAt;

    useQuestStore.getState().updateQuest(created.id, { reward: '200 po' });
    const updated = useQuestStore.getState().quests[0];
    expect(updated.reward).toBe('200 po');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
  });

  it('cambia el estado de una misión con setQuestStatus', () => {
    const created = useQuestStore.getState().addQuest({ title: 'Cazar al lobo', status: 'activa' });
    useQuestStore.getState().setQuestStatus(created.id, 'resuelta');
    expect(useQuestStore.getState().quests[0].status).toBe('resuelta');

    useQuestStore.getState().setQuestStatus(created.id, 'fallida');
    expect(useQuestStore.getState().quests[0].status).toBe('fallida');
  });

  it('elimina una misión', () => {
    const created = useQuestStore.getState().addQuest({ title: 'Investigar la torre', status: 'activa' });
    expect(useQuestStore.getState().quests).toHaveLength(1);

    useQuestStore.getState().removeQuest(created.id);
    expect(useQuestStore.getState().quests).toHaveLength(0);
  });

  it('mantiene las misiones más nuevas primero', () => {
    useQuestStore.getState().addQuest({ title: 'Primera', status: 'activa' });
    useQuestStore.getState().addQuest({ title: 'Segunda', status: 'activa' });
    const titles = useQuestStore.getState().quests.map((q) => q.title);
    expect(titles).toEqual(['Segunda', 'Primera']);
  });
});
