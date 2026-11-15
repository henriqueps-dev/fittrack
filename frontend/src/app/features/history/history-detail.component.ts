import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ArrowLeft, LucideAngularModule, NotebookPen, Trash2 } from 'lucide-angular';
import { Session, SessionExercise } from '../../core/models/api.models';
import { SessionApi } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { EQUIPMENT_LABEL, MUSCLE_LABEL, duration, kg, longDate, relativeDay, volume } from '../../core/utils/format';

/** Detalhe de um treino realizado: totais, comparacao com o anterior e series por exercicio. */
@Component({
  selector: 'app-history-detail',
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head enter">
        <div class="titles">
          <a routerLink="/historico" class="back"><lucide-icon [img]="icons.back" [size]="16" /> Histórico</a>
          @if (session(); as s) {
            <span class="eyebrow date">{{ fmt.longDate(s.startedAt) }} · {{ time(s.startedAt) }}</span>
            <h1>{{ s.workoutName }}</h1>
          } @else { <div class="skeleton" style="height: 44px; width: 260px"></div> }
        </div>
        @if (session()) {
          <button type="button" class="btn danger sm" (click)="confirm.set(true)"><lucide-icon [img]="icons.trash" [size]="16" /> Excluir</button>
        }
      </header>

      @if (session(); as s) {
        <section class="card stats enter enter-1">
          <div class="stat"><span class="value num">{{ fmt.duration(s.durationSeconds) }}</span><span class="label">duração</span></div>
          <div class="stat"><span class="value num">{{ fmt.volume(s.totalVolume) }}</span><span class="label">volume</span></div>
          <div class="stat"><span class="value num">{{ s.completedSets }}</span><span class="label">séries</span></div>
          <div class="stat"><span class="value num">{{ s.totalReps }}</span><span class="label">repetições</span></div>
        </section>

        @if (s.comparison; as c) {
          <section class="card compare enter enter-2">
            <span class="muted">Comparado ao treino anterior ({{ fmt.relativeDay(c.previousDate) }})</span>
            <div class="deltas">
              <span class="num" [class.up]="c.volumeDelta > 0" [class.down]="c.volumeDelta < 0">{{ sign(c.volumeDelta) }}{{ fmt.volume(abs(c.volumeDelta)) }} volume</span>
              <span class="num faint">{{ s.completedSets - c.previousCompletedSets >= 0 ? '+' : '−' }}{{ abs(s.completedSets - c.previousCompletedSets) }} séries</span>
            </div>
          </section>
        }

        @if (s.notes) {
          <section class="card notes enter enter-2"><lucide-icon [img]="icons.notes" [size]="18" /><p>{{ s.notes }}</p></section>
        }

        <section class="section enter enter-3">
          <div class="section-head"><h2>Exercícios</h2></div>
          <div class="ex-list">
            @for (e of s.exercises; track e.order) {
              <article class="card ex" [class.skipped]="e.skipped">
                <header class="ex-head">
                  <div class="grow">
                    <a class="ex-name" [routerLink]="['/exercicios', e.exercise.id]">{{ e.exercise.name }}</a>
                    <span class="faint small">{{ muscleLabel[e.exercise.primaryMuscle.slug] }} · {{ eqLabel[e.exercise.equipment] }}</span>
                  </div>
                  @if (e.skipped) { <span class="tag">Pulado</span> } @else if (!hasDone(e)) { <span class="tag">Não feito</span> } @else { <span class="tag red num">{{ fmt.volume(exVolume(e)) }}</span> }
                </header>
                @if (!e.skipped) {
                  <table class="sets">
                    <thead><tr><th scope="col">Série</th><th scope="col">Carga</th><th scope="col">Reps</th><th scope="col">Volume</th></tr></thead>
                    <tbody>
                      @for (x of e.sets; track x.setNumber) {
                        <tr [class.miss]="!x.completed" [class.best]="x.completed && isBest(e, x.weightKg)">
                          <td class="num">{{ x.setNumber }}</td>
                          <td class="num">{{ fmt.kg(x.weightKg) }}</td>
                          <td class="num">{{ x.reps }}</td>
                          <td class="num">{{ x.completed ? fmt.volume(x.weightKg * x.reps) : 'não feita' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </article>
            }
          </div>
        </section>
      } @else if (!error()) {
        <div class="skeleton" style="height: 100px"></div>
        <div class="skeleton" style="height: 260px"></div>
      }
    </div>

    @if (confirm()) {
      <div class="sheet-backdrop" (click)="confirm.set(false)">
        <div class="sheet" role="alertdialog" aria-modal="true" aria-labelledby="del-t" (click)="$event.stopPropagation()">
          <h2 id="del-t">Excluir este treino?</h2>
          <p class="muted">O registro e suas séries saem do histórico e das estatísticas. Não dá para desfazer.</p>
          <div class="sheet-actions">
            <button type="button" class="btn ghost" (click)="confirm.set(false)">Cancelar</button>
            <button type="button" class="btn danger" (click)="remove()" [disabled]="busy()">Excluir</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .back { display: inline-flex; align-items: center; gap: 6px; width: fit-content; font-size: 0.85rem; color: var(--text-3); text-decoration: none; }
    .back:hover { color: var(--text); }
    .date { text-transform: none; letter-spacing: 0.04em; }
    .date::first-letter { text-transform: uppercase; }
    .small { font-size: 0.8rem; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    @media (min-width: 640px) { .stats { grid-template-columns: repeat(4, 1fr); } }
    .compare { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; font-size: 0.9rem; }
    .deltas { display: flex; gap: 16px; font-weight: 600; }
    .up { color: var(--success); }
    .down { color: var(--red-text); }
    .notes { display: flex; gap: 12px; color: var(--text-2); }
    .notes lucide-icon { color: var(--red-text); flex: none; margin-top: 2px; }
    .notes p { margin: 0; white-space: pre-line; }
    .ex-list { display: grid; gap: 12px; }
    @media (min-width: 900px) { .ex-list { grid-template-columns: 1fr 1fr; } }
    .ex { display: flex; flex-direction: column; gap: 12px; }
    .ex.skipped { opacity: 0.55; }
    .ex-head { display: flex; align-items: flex-start; gap: 10px; }
    .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .ex-name { font-weight: 600; font-size: 1.02rem; color: var(--text); text-decoration: none; }
    .ex-name:hover { color: var(--red-text); }
    .sets { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .sets th { text-align: left; font-weight: 500; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); padding: 0 0 6px; }
    .sets td { padding: 8px 0; border-top: 1px solid var(--border); }
    .sets th:last-child, .sets td:last-child { text-align: right; }
    .sets tr.miss td { color: var(--text-3); text-decoration: line-through; }
    .sets tr.miss td:last-child { text-decoration: none; font-size: 0.8rem; }
    .sets tr.best td:nth-child(2) { color: var(--red-text); font-weight: 700; }
  `,
})
export class HistoryDetailComponent {
  private readonly api = inject(SessionApi);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly icons = { back: ArrowLeft, trash: Trash2, notes: NotebookPen };
  protected readonly fmt = { duration, kg, longDate, relativeDay, volume };
  protected readonly eqLabel = EQUIPMENT_LABEL;
  protected readonly muscleLabel = MUSCLE_LABEL;
  protected readonly session = signal<Session | null>(null);
  protected readonly error = signal(false);
  protected readonly confirm = signal(false);
  protected readonly busy = signal(false);
  protected readonly abs = Math.abs;

  private readonly maxByExercise = computed(() => new Map(
    (this.session()?.exercises ?? []).map((e) => [e.order, Math.max(0, ...e.sets.filter((x) => x.completed).map((x) => Number(x.weightKg)))]),
  ));

  constructor() {
    queueMicrotask(() => void this.load());
  }

  private async load(): Promise<void> {
    try {
      this.session.set(await this.api.get(Number(this.id())));
    } catch (err) {
      this.error.set(true);
      this.toast.error(err, 'Treino não encontrado.');
      await this.router.navigateByUrl('/historico');
    }
  }

  exVolume(e: SessionExercise): number {
    return e.sets.filter((x) => x.completed).reduce((a, x) => a + Number(x.weightKg) * Number(x.reps), 0);
  }

  hasDone(e: SessionExercise): boolean {
    return e.sets.some((x) => x.completed);
  }

  isBest(e: SessionExercise, w: number): boolean {
    const max = this.maxByExercise().get(e.order) ?? 0;
    return max > 0 && Number(w) === max;
  }

  sign(n: number): string {
    return n > 0 ? '+' : n < 0 ? '−' : '';
  }

  time(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  async remove(): Promise<void> {
    this.busy.set(true);
    try {
      await this.api.delete(Number(this.id()));
      this.toast.success('Treino excluído do histórico.');
      await this.router.navigateByUrl('/historico');
    } catch (err) {
      this.toast.error(err, 'Não foi possível excluir.');
    } finally {
      this.busy.set(false);
    }
  }
}
