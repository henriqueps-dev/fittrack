import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ArrowLeft, Bell, Check, ChevronLeft, ChevronRight, CloudOff, Flag, LucideAngularModule, Minus, Plus, SkipForward, Timer,
  Trash2, Trophy, Undo2, X,
} from 'lucide-angular';
import { FinishResponse, RecordDto, Session, SessionExercise, SetDto } from '../../core/models/api.models';
import { RestTimerService } from '../../core/services/rest-timer.service';
import { SessionStore } from '../../core/services/session.store';
import { ToastService } from '../../core/services/toast.service';
import { EQUIPMENT_LABEL, MUSCLE_LABEL, RECORD_LABEL, clock, duration, kg, relativeDay, volume } from '../../core/utils/format';
import { ExerciseAnimationComponent } from '../../shared/exercise-animation/exercise-animation.component';

/** Tela de execucao do treino: series com carga/repeticoes, descanso automatico e finalizacao com resumo. */
@Component({
  selector: 'app-session-runner',
  imports: [RouterLink, LucideAngularModule, ExerciseAnimationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-runner.component.html',
  styleUrl: './session-runner.component.scss',
})
export class SessionRunnerComponent {
  protected readonly store = inject(SessionStore);
  protected readonly timer = inject(RestTimerService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly icons = {
    back: ArrowLeft, check: Check, prev: ChevronLeft, next: ChevronRight, offline: CloudOff, flag: Flag, minus: Minus,
    plus: Plus, skip: SkipForward, timer: Timer, trash: Trash2, trophy: Trophy, undo: Undo2, x: X, bell: Bell,
  };
  protected readonly fmt = { clock, duration, kg, volume, relativeDay };
  protected readonly eqLabel = EQUIPMENT_LABEL;
  protected readonly muscleLabel = MUSCLE_LABEL;
  protected readonly recordLabel = RECORD_LABEL;

  protected readonly now = signal(Date.now());
  protected readonly confirmFinish = signal(false);
  protected readonly confirmDiscard = signal(false);
  protected readonly busy = signal(false);
  protected readonly result = signal<{ session: Session; records: RecordDto[]; queued: boolean } | null>(null);

  protected readonly session = this.store.active;
  protected readonly cursor = computed(() => {
    const s = this.session();
    if (!s) return 0;
    return Math.min(Math.max(0, (s as Session & { cursor?: number }).cursor ?? 0), s.exercises.length - 1);
  });
  protected readonly current = computed<SessionExercise | null>(() => this.session()?.exercises[this.cursor()] ?? null);
  protected readonly elapsed = computed(() => {
    const s = this.session();
    return s ? Math.max(0, (this.now() - new Date(s.startedAt).getTime()) / 1000) : 0;
  });
  protected readonly liveVolume = computed(() =>
    (this.session()?.exercises ?? []).filter((e) => !e.skipped).flatMap((e) => e.sets).filter((x) => x.completed)
      .reduce((a, x) => a + Number(x.weightKg) * Number(x.reps), 0));
  protected readonly pendingSets = computed(() => this.store.progress().total - this.store.progress().done);

  constructor() {
    const handle = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(handle));
    void this.init();
  }

  private async init(): Promise<void> {
    await this.store.restore();
    if (!this.session() && !this.result()) await this.router.navigateByUrl('/treinos');
  }

  doneCount(e: SessionExercise): number {
    return e.sets.filter((x) => x.completed).length;
  }

  go(index: number): void {
    const s = this.session();
    if (!s || index < 0 || index >= s.exercises.length) return;
    this.store.setCursor(index);
  }

  previousFor(e: SessionExercise, i: number): string {
    const p = e.previous.find((x) => x.setNumber === i + 1);
    return p ? `${kg(p.weightKg).replace(' kg', '')} × ${p.reps}` : '—';
  }

  setValue(e: SessionExercise, i: number, field: 'weightKg' | 'reps', raw: string): void {
    const n = Number(String(raw).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return;
    const value = field === 'reps' ? Math.min(200, Math.round(n)) : Math.min(1000, Math.round(n * 4) / 4);
    this.store.updateSet(e.order, i, { [field]: value });
  }

  bump(e: SessionExercise, i: number, delta: number): void {
    const set = e.sets[i];
    this.store.updateSet(e.order, i, { weightKg: Math.max(0, Math.round((Number(set.weightKg) + delta) * 4) / 4) });
  }

  toggleSet(e: SessionExercise, i: number): void {
    const set: SetDto = e.sets[i];
    const completing = !set.completed;
    this.store.updateSet(e.order, i, { completed: completing });
    if (!completing) return;
    navigator.vibrate?.(30);
    // repete a carga nas proximas series ainda vazias
    e.sets.forEach((x, j) => {
      if (j > i && !x.completed && !Number(x.weightKg) && Number(set.weightKg)) this.store.updateSet(e.order, j, { weightKg: set.weightKg });
    });
    const remainingHere = e.sets.filter((x, j) => j !== i && !x.completed).length;
    if (remainingHere === 0) {
      // exercicio concluido: avanca para o proximo pendente
      const s = this.session()!;
      const next = s.exercises.findIndex((x, j) => j > this.cursor() && !x.skipped && x.sets.some((y) => !y.completed));
      if (next >= 0) {
        this.timer.start(e.restSeconds);
        setTimeout(() => this.go(next), 450);
      } else if (this.pendingSets() <= 1) {
        this.timer.stop();
        setTimeout(() => this.confirmFinish.set(true), 450);
      }
      return;
    }
    this.timer.start(e.restSeconds);
  }

  toggleSkip(e: SessionExercise): void {
    this.store.setSkipped(e.order, !e.skipped);
    if (!e.skipped) {
      const s = this.session()!;
      const next = s.exercises.findIndex((x, j) => j > this.cursor() && !x.skipped);
      if (next >= 0) this.go(next);
    }
  }

  async enableNotifications(): Promise<void> {
    const ok = await this.timer.enableNotifications();
    this.toast.show(ok ? 'Você será avisado quando o descanso acabar.' : 'Notificações bloqueadas no navegador.');
  }

  async finish(): Promise<void> {
    this.busy.set(true);
    try {
      this.timer.stop();
      const r = await this.store.finish();
      this.confirmFinish.set(false);
      if (r.kind === 'online') {
        const res: FinishResponse = r.response;
        this.result.set({ session: res.session, records: res.newRecords, queued: false });
      } else {
        this.result.set({ session: r.session, records: [], queued: true });
      }
    } catch (err) {
      this.toast.error(err, 'Não foi possível finalizar o treino.');
    } finally {
      this.busy.set(false);
    }
  }

  async discard(): Promise<void> {
    this.busy.set(true);
    try {
      this.timer.stop();
      await this.store.discard();
      this.toast.show('Treino descartado.');
      await this.router.navigateByUrl('/treinos');
    } catch (err) {
      this.toast.error(err, 'Não foi possível descartar.');
    } finally {
      this.busy.set(false);
    }
  }

  delta(n: number): string {
    const sign = n > 0 ? '+' : n < 0 ? '−' : '';
    return `${sign}${volume(Math.abs(n))}`;
  }
}
