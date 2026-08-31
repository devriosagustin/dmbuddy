// ============================================================
// Dashboard: resumen de la sesión, acciones rápidas y stats
// ============================================================

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Swords,
  Dices,
  NotebookPen,
  Skull,
  Users,
  Activity,
  Heart,
  FileText,
  Play,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useCombatStore } from '../../store/combatStore';
import { useMonsterStore } from '../../store/monsterStore';
import { usePlayerStore } from '../../store/playerStore';
import { useNoteStore } from '../../store/noteStore';
import { useDiceStore } from '../../store/diceStore';

/**
 * Página principal con resumen de la sesión.
 */
export const Dashboard = () => {
  const navigate = useNavigate();
  const combat = useCombatStore();
  const monsters = useMonsterStore((s) => s.monsters);
  const players = usePlayerStore((s) => s.players);
  const notes = useNoteStore((s) => s.notes);
  const diceTotal = useDiceStore((s) => s.totalRolls);

  const playersInCombat = combat.participants.filter((p) => p.type === 'player');
  const averageHp = playersInCombat.length === 0
    ? 0
    : Math.round(
        playersInCombat.reduce((acc, p) => acc + (p.hp / Math.max(1, p.maxHp)), 0) /
          playersInCombat.length *
          100
      );

  const recentLog = combat.combatLog.slice(-5);
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const statCards = [
    { label: 'Monstruos en biblioteca', value: monsters.length, icon: Skull, color: 'text-dnd-gold' },
    { label: 'Aventureros del party', value: players.length, icon: Users, color: 'text-emerald-300' },
    { label: 'Encuentros jugados', value: combat.encounterCount, icon: Activity, color: 'text-sky-300' },
    { label: 'Tiradas de dados', value: diceTotal, icon: TrendingUp, color: 'text-purple-300' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

return (
    <div className="page">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
        {/* Saludo y estado del combate */}
        <motion.section
          variants={item}
          className={`card overflow-hidden ${combat.isActive ? 'border-dnd-gold/60' : ''}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="page-title">Resumen de la sesión</h2>
              <p className="text-sm text-dnd-muted">
                {combat.isActive ? (
                  <>
                    ⚔️ Combate en curso · Ronda{' '}
                    <span className="font-bold text-dnd-text">{combat.round}</span> ·{' '}
                    <span className="font-bold text-dnd-text">{combat.participants.length}</span>{' '}
                    combatientes
                  </>
                ) : (
                  'No hay un combate activo. Cuando empieces, verás aquí los detalles.'
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={combat.isActive ? 'secondary' : 'primary'}
                icon={<Swords size={16} />}
                onClick={() => navigate('/combat')}
              >
                {combat.isActive ? 'Ir al combate' : 'Iniciar combate'}
              </Button>
              <Button variant="ghost" icon={<Dices size={16} />} onClick={() => navigate('/dice')}>
                Lanzar dados
              </Button>
              <Button variant="ghost" icon={<NotebookPen size={16} />} onClick={() => navigate('/notes')}>
                Nota rápida
              </Button>
            </div>
          </div>

          {/* Salud del party */}
          {combat.isActive && playersInCombat.length > 0 && (
            <div className="mt-4 border-t border-dnd-leather/30 pt-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-dnd-muted">
                  <Heart size={13} className="text-red-400" aria-hidden="true" /> Salud media del party
                </span>
                <span className="font-bold text-dnd-text">{averageHp}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-dnd-ink/80">
                <motion.div
                  className={`h-full rounded-full transition-all ${averageHp > 60 ? 'bg-green-600' : averageHp > 30 ? 'bg-yellow-500' : 'bg-red-600'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${averageHp}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          )}
        </motion.section>

        {/* Estadísticas */}
        <motion.section variants={item} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card flex items-center gap-3">
              <span className={`rounded-xl bg-dnd-ink/60 p-2.5 ${color}`}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="font-fantasy text-2xl font-bold text-dnd-text">{value}</p>
                <p className="text-[11px] text-dnd-muted">{label}</p>
              </div>
            </div>
          ))}
        </motion.section>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Últimas acciones del registro */}
          <motion.section variants={item} className="card">
            <h3 className="mb-2 card-title">
              <Activity size={15} aria-hidden="true" /> Últimas acciones
            </h3>
            {recentLog.length === 0 ? (
              <p className="text-sm text-dnd-muted">Sin eventos aún. Inicia un combate para ver el registro.</p>
            ) : (
              <ul className="space-y-1.5 font-body text-xs">
                {recentLog
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <li key={entry.id} className="border-b border-dnd-leather/20 pb-1.5 text-dnd-text/80">
                      {entry.message}
                    </li>
                  ))}
              </ul>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => navigate('/combat')}
              icon={<Play size={13} />}
            >
              Abrir registro completo
            </Button>
          </motion.section>

          {/* Notas recientes */}
          <motion.section variants={item} className="card">
            <h3 className="mb-2 card-title">
              <FileText size={15} aria-hidden="true" /> Notas recientes
            </h3>
            {recentNotes.length === 0 ? (
              <p className="text-sm text-dnd-muted">Crea tu primera nota para la campaña.</p>
            ) : (
              <ul className="space-y-1.5">
                {recentNotes.map((note) => (
                  <li key={note.id}>
                    <button
                      onClick={() => navigate('/notes')}
                      className="w-full text-left hover:bg-dnd-leather/20 rounded-lg px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold"
                    >
                      <p className="truncate text-sm font-bold text-dnd-text">{note.title}</p>
                      <p className="text-[11px] text-dnd-muted">
                        {note.category} · {new Date(note.updatedAt).toLocaleDateString('es-ES')}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        </div>

        {/* Acceso rápido a la biblioteca */}
        <motion.section variants={item} className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
<h3 className="card-title">
                <Skull size={15} aria-hidden="true" /> Biblioteca de monstruos
              </h3>
              <p className="text-xs text-dnd-muted">
                Preparados {monsters.length} criaturas para encontrar en tu próxima sesión.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/monsters')}>
              Explorar monstruos
            </Button>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Dashboard;
