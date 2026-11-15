import { Difficulty, Equipment, MuscleSlug, RecordType, TrainingGoal } from '../models/api.models';

const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export function kg(value: number | null | undefined): string {
  return `${nf2.format(Number(value ?? 0))} kg`;
}

/** Volume total em kg, abreviando para toneladas a partir de 10 t. */
export function volume(value: number | null | undefined): string {
  const v = Number(value ?? 0);
  if (v >= 10000) return `${nf1.format(v / 1000)} t`;
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v)} kg`;
}

export function duration(seconds: number | null | undefined): string {
  const s = Math.max(0, Math.round(Number(seconds ?? 0)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
  if (s < 60) return `${s}s`;
  return `${m}min`;
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = sec.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function longDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export function relativeDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(today) - start(d)) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff < 7) return `Há ${diff} dias`;
  return shortDate(iso);
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  BARBELL: 'Barra',
  DUMBBELL: 'Halteres',
  MACHINE: 'Máquina',
  CABLE: 'Cabo / Polia',
  BODYWEIGHT: 'Peso corporal',
  KETTLEBELL: 'Kettlebell',
  SMITH: 'Smith',
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
};

export const GOAL_LABEL: Record<TrainingGoal, string> = {
  HYPERTROPHY: 'Hipertrofia',
  STRENGTH: 'Força',
  FAT_LOSS: 'Emagrecimento',
  ENDURANCE: 'Resistência',
  HEALTH: 'Saúde e bem-estar',
};

export const RECORD_LABEL: Record<RecordType, string> = {
  MAX_WEIGHT: 'Maior carga',
  EST_1RM: '1RM estimado',
  MAX_REPS: 'Mais repetições',
};

export const MUSCLE_ORDER: MuscleSlug[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'quads', 'hamstrings', 'glutes', 'calves',
];

export const MUSCLE_LABEL: Record<MuscleSlug, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraço',
  abs: 'Abdômen',
  quads: 'Quadríceps',
  hamstrings: 'Posterior de coxa',
  glutes: 'Glúteos',
  calves: 'Panturrilhas',
};
