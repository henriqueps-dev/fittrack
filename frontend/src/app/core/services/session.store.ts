import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { FinishResponse, Session, SessionPayload, SetDto, Workout } from '../models/api.models';
import { storage, uuid } from '../utils/storage';
import { SessionApi } from './api.services';
import { AuthService } from './auth.service';
import { NetworkService } from './network.service';
import { ToastService, isNetworkError } from './toast.service';

const ACTIVE_KEY = 'ft.activeSession';
const PENDING_KEY = 'ft.pendingSessions';
const AUTOSAVE_DELAY = 1200;

interface LocalSession extends Session {
  /** Ha alteracoes ainda nao enviadas ao servidor. */
  dirty?: boolean;
  /** Sessao iniciada sem conexao (ainda nao existe no servidor). */
  offline?: boolean;
  /** Indice do exercicio em foco na tela de execucao. */
  cursor?: number;
}

export type FinishResult = { kind: 'online'; response: FinishResponse } | { kind: 'queued'; session: Session };

/**
 * Estado do treino em execucao. Fonte da verdade local (localStorage) com salvamento
 * automatico no servidor e fila de sincronizacao para treinos feitos offline.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly api = inject(SessionApi);
  private readonly auth = inject(AuthService);
  private readonly network = inject(NetworkService);
  private readonly toast = inject(ToastService);

  private readonly _active = signal<LocalSession | null>(storage.get<LocalSession | null>(ACTIVE_KEY, null));
  private readonly _pending = signal<SessionPayload[]>(storage.get<SessionPayload[]>(PENDING_KEY, []));
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private saving = false;
  private syncing = false;

  readonly active = this._active.asReadonly();
  readonly pendingCount = computed(() => this._pending().length);
  readonly saveState = signal<'saved' | 'saving' | 'local'>('saved');

  readonly progress = computed(() => {
    const s = this._active();
    if (!s) return { done: 0, total: 0, ratio: 0 };
    const sets = s.exercises.filter((e) => !e.skipped).flatMap((e) => e.sets);
    const done = sets.filter((x) => x.completed).length;
    return { done, total: sets.length, ratio: sets.length ? done / sets.length : 0 };
  });

  constructor() {
    effect(() => {
      // Ao reconectar, envia treinos pendentes e progresso nao salvo.
      if (this.network.online() && this.auth.isAuthenticated()) {
        void this.syncPending();
        if (this._active()?.dirty) this.scheduleSave(0);
      }
    });
  }

  /** Recupera um treino em andamento salvo no servidor (ex.: iniciado em outro dispositivo). */
  async restore(): Promise<void> {
    if (this._active()) return;
    try {
      const remote = await this.api.active();
      if (remote) this.set({ ...remote, cursor: firstOpenIndex(remote) });
    } catch {
      /* sem conexao: segue com o estado local */
    }
  }

  async start(workout: Workout): Promise<Session> {
    const current = this._active();
    if (current) return current;
    const clientId = uuid();
    try {
      const s = await this.api.start(workout.id, clientId);
      this.set({ ...s, cursor: 0 });
      return s;
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 409) {
        await this.restore();
        const restored = this._active();
        if (restored) {
          this.toast.show('Você já tinha um treino em andamento. Continuando de onde parou.');
          return restored;
        }
      }
      if (!isNetworkError(err)) throw err;
      // Sem conexao: monta a sessao a partir do treino em cache, com as cargas da ultima vez.
      const local = buildOfflineSession(workout, clientId);
      this.set(local);
      this.saveState.set('local');
      this.toast.show('Sem conexão: o treino será sincronizado quando a internet voltar.');
      return local;
    }
  }

  setCursor(index: number): void {
    this.mutate((s) => ({ ...s, cursor: index }), false);
  }

  updateSet(order: number, setIndex: number, patch: Partial<SetDto>): void {
    this.mutate((s) => ({
      ...s,
      exercises: s.exercises.map((e) => e.order !== order ? e : {
        ...e,
        sets: e.sets.map((x, i) => {
          if (i !== setIndex) return x;
          const next = { ...x, ...patch };
          if (patch.completed === true && !x.completed) next.completedAt = new Date().toISOString();
          if (patch.completed === false) next.completedAt = undefined;
          return next;
        }),
      }),
    }));
  }

  addSet(order: number): void {
    this.mutate((s) => ({
      ...s,
      exercises: s.exercises.map((e) => {
        if (e.order !== order || e.sets.length >= 20) return e;
        const last = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [...e.sets, { setNumber: e.sets.length + 1, weightKg: last?.weightKg ?? 0, reps: last?.reps ?? e.plannedReps, completed: false }],
        };
      }),
    }));
  }

  removeSet(order: number, setIndex: number): void {
    this.mutate((s) => ({
      ...s,
      exercises: s.exercises.map((e) => e.order !== order || e.sets.length <= 1 ? e : {
        ...e,
        sets: e.sets.filter((_, i) => i !== setIndex).map((x, i) => ({ ...x, setNumber: i + 1 })),
      }),
    }));
  }

  setSkipped(order: number, skipped: boolean): void {
    this.mutate((s) => ({ ...s, exercises: s.exercises.map((e) => (e.order === order ? { ...e, skipped } : e)) }));
  }

  setNotes(notes: string): void {
    this.mutate((s) => ({ ...s, notes }));
  }

  async finish(): Promise<FinishResult> {
    const s = this._active();
    if (!s) throw new Error('Nenhum treino em andamento');
    this.clearTimer();
    const payload = toPayload(s, new Date().toISOString());
    try {
      const response = await this.api.finish(payload);
      this.clear();
      return { kind: 'online', response };
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      this._pending.update((list) => [...list.filter((p) => p.clientId !== payload.clientId), payload]);
      storage.set(PENDING_KEY, this._pending());
      const summary = summarize(s, payload.finishedAt!);
      this.clear();
      return { kind: 'queued', session: summary };
    }
  }

  async discard(): Promise<void> {
    const s = this._active();
    if (!s) return;
    this.clearTimer();
    if (s.id) {
      try {
        await this.api.delete(s.id);
      } catch (err) {
        if (!isNetworkError(err) && !(err instanceof HttpErrorResponse && err.status === 404)) throw err;
      }
    }
    this.clear();
  }

  /** Envia treinos finalizados offline. Idempotente no servidor (clientId). */
  async syncPending(): Promise<void> {
    if (this.syncing || !this._pending().length) return;
    this.syncing = true;
    let synced = 0;
    try {
      for (const payload of [...this._pending()]) {
        try {
          await this.api.finish(payload);
          synced++;
          this.removePending(payload.clientId);
        } catch (err) {
          if (isNetworkError(err)) break;
          // Erro de validacao nao se resolve sozinho: descarta para nao travar a fila.
          this.removePending(payload.clientId);
          this.toast.error(err, 'Não foi possível sincronizar um treino offline.');
        }
      }
    } finally {
      this.syncing = false;
    }
    if (synced) this.toast.success(synced === 1 ? 'Treino offline sincronizado.' : `${synced} treinos offline sincronizados.`);
  }

  // ------------------------------------------------------------------------------------

  private mutate(fn: (s: LocalSession) => LocalSession, persistRemote = true): void {
    const s = this._active();
    if (!s) return;
    const next = fn(s);
    this.set(persistRemote ? { ...next, dirty: true } : next);
    if (persistRemote) this.scheduleSave(AUTOSAVE_DELAY);
  }

  private scheduleSave(delay: number): void {
    this.clearTimer();
    this.saveState.set('saving');
    this.saveTimer = setTimeout(() => void this.save(), delay);
  }

  private async save(): Promise<void> {
    const s = this._active();
    if (!s || this.saving) return;
    if (!this.network.online()) {
      this.saveState.set('local');
      return;
    }
    this.saving = true;
    try {
      const saved = await this.api.progress(toPayload(s, null));
      const current = this._active();
      // So limpa o "dirty" se nada mudou durante o envio.
      if (current && current.clientId === s.clientId) {
        const unchanged = JSON.stringify(current.exercises) === JSON.stringify(s.exercises) && current.notes === s.notes;
        this.set({ ...current, id: saved.id, offline: false, dirty: !unchanged });
        if (!unchanged) this.scheduleSave(AUTOSAVE_DELAY);
      }
      this.saveState.set('saved');
    } catch (err) {
      this.saveState.set('local');
      if (!isNetworkError(err)) this.toast.error(err, 'Não foi possível salvar o progresso.');
    } finally {
      this.saving = false;
    }
  }

  private set(s: LocalSession): void {
    this._active.set(s);
    storage.set(ACTIVE_KEY, s);
  }

  private clear(): void {
    this._active.set(null);
    storage.remove(ACTIVE_KEY);
    this.saveState.set('saved');
  }

  private clearTimer(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
  }

  private removePending(clientId: string): void {
    this._pending.update((list) => list.filter((p) => p.clientId !== clientId));
    storage.set(PENDING_KEY, this._pending());
  }
}

function firstOpenIndex(s: Session): number {
  const i = s.exercises.findIndex((e) => !e.skipped && e.sets.some((x) => !x.completed));
  return i < 0 ? 0 : i;
}

export function toPayload(s: Session, finishedAt: string | null): SessionPayload {
  return {
    clientId: s.clientId,
    workoutId: s.workoutId ?? null,
    workoutName: s.workoutName,
    startedAt: s.startedAt,
    finishedAt,
    notes: s.notes ?? null,
    exercises: s.exercises.map((e) => ({
      exerciseId: e.exercise.id,
      order: e.order,
      plannedReps: e.plannedReps,
      restSeconds: e.restSeconds,
      skipped: e.skipped,
      sets: e.sets.map((x) => ({
        setNumber: x.setNumber,
        weightKg: Number(x.weightKg) || 0,
        reps: Math.max(0, Math.round(Number(x.reps) || 0)),
        completed: x.completed,
        completedAt: x.completedAt ?? null,
      })),
    })),
  };
}

function buildOfflineSession(w: Workout, clientId: string): LocalSession {
  return {
    clientId,
    workoutId: w.id,
    workoutName: w.name,
    status: 'IN_PROGRESS',
    startedAt: new Date().toISOString(),
    durationSeconds: 0,
    totalVolume: 0,
    totalReps: 0,
    completedSets: 0,
    offline: true,
    dirty: true,
    cursor: 0,
    exercises: w.exercises.map((we) => ({
      exercise: we.exercise,
      order: we.position,
      plannedReps: we.reps,
      restSeconds: we.restSeconds,
      skipped: false,
      previous: we.lastSets,
      previousDate: we.lastPerformedAt,
      sets: Array.from({ length: we.sets }, (_, i) => ({
        setNumber: i + 1,
        weightKg: (we.lastSets.find((x) => x.setNumber === i + 1) ?? we.lastSets[we.lastSets.length - 1])?.weightKg ?? 0,
        reps: we.reps,
        completed: false,
      })),
    })),
  };
}

/** Resumo calculado localmente para treinos finalizados sem conexao. */
function summarize(s: Session, finishedAt: string): Session {
  const done = s.exercises.filter((e) => !e.skipped).flatMap((e) => e.sets).filter((x) => x.completed);
  return {
    ...s,
    status: 'COMPLETED',
    finishedAt,
    durationSeconds: Math.round((new Date(finishedAt).getTime() - new Date(s.startedAt).getTime()) / 1000),
    totalVolume: done.reduce((acc, x) => acc + Number(x.weightKg) * Number(x.reps), 0),
    totalReps: done.reduce((acc, x) => acc + Number(x.reps), 0),
    completedSets: done.length,
  };
}
