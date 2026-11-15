import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArrowLeft, GripVertical, LucideAngularModule, Minus, Plus, Trash2, X } from 'lucide-angular';
import { Exercise, ExerciseSummary, WorkoutRequest } from '../../core/models/api.models';
import { WorkoutApi } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from '../../core/utils/format';
import { ExerciseBrowserComponent } from '../../shared/exercise-browser/exercise-browser.component';

interface Item {
  key: number;
  exercise: ExerciseSummary;
  sets: number;
  reps: number;
  restSeconds: number;
  notes: string;
}

const LETTERS = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
const REST_OPTIONS = [30, 45, 60, 75, 90, 120, 150, 180, 240];

/** Montagem e edicao de treino: dados basicos, exercicios ordenaveis e seletor da biblioteca. */
@Component({
  selector: 'app-workout-builder',
  imports: [FormsModule, RouterLink, LucideAngularModule, CdkDropList, CdkDrag, CdkDragHandle, ExerciseBrowserComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workout-builder.component.html',
  styleUrl: './workout-builder.component.scss',
})
export class WorkoutBuilderComponent {
  private readonly api = inject(WorkoutApi);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Parametro de rota (:id) na edicao. */
  readonly id = input<string>();

  protected readonly icons = { back: ArrowLeft, grip: GripVertical, plus: Plus, minus: Minus, trash: Trash2, x: X };
  protected readonly letters = LETTERS;
  protected readonly restOptions = REST_OPTIONS;
  protected readonly eqLabel = EQUIPMENT_LABEL;
  protected readonly muscleLabel = MUSCLE_LABEL;

  protected readonly name = signal('');
  protected readonly letter = signal('');
  protected readonly description = signal('');
  protected readonly items = signal<Item[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly pickerOpen = signal(false);
  protected readonly submitted = signal(false);
  private nextKey = 1;

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly selectedIds = computed(() => this.items().map((i) => i.exercise.id));
  protected readonly nameError = computed(() => this.submitted() && !this.name().trim() ? 'Dê um nome ao treino.' : '');
  protected readonly totalSets = computed(() => this.items().reduce((a, i) => a + i.sets, 0));
  /** Estimativa simples: ~40 s por serie + descanso entre series. */
  protected readonly estimatedMinutes = computed(() =>
    Math.max(0, Math.round(this.items().reduce((a, i) => a + i.sets * 40 + Math.max(0, i.sets - 1) * i.restSeconds, 0) / 60)));
  protected readonly muscles = computed(() => [...new Set(this.items().map((i) => this.muscleLabel[i.exercise.primaryMuscle.slug]))]);

  constructor() {
    queueMicrotask(() => void this.load());
  }

  private async load(): Promise<void> {
    const id = Number(this.id());
    if (!id) return;
    this.loading.set(true);
    try {
      const w = await this.api.get(id);
      this.name.set(w.name);
      this.letter.set(w.letter ?? '');
      this.description.set(w.description ?? '');
      this.items.set(w.exercises.map((e) => ({
        key: this.nextKey++, exercise: e.exercise, sets: e.sets, reps: e.reps, restSeconds: e.restSeconds, notes: e.notes ?? '',
      })));
    } catch (err) {
      this.toast.error(err, 'Não foi possível carregar o treino.');
      await this.router.navigateByUrl('/treinos');
    } finally {
      this.loading.set(false);
    }
  }

  toggle(ex: Exercise): void {
    const exists = this.items().some((i) => i.exercise.id === ex.id);
    if (exists) {
      this.items.update((list) => list.filter((i) => i.exercise.id !== ex.id));
      return;
    }
    const heavy = ex.equipment === 'BARBELL' || ex.equipment === 'SMITH';
    this.items.update((list) => [...list, {
      key: this.nextKey++,
      exercise: ex,
      sets: 3,
      reps: heavy ? 8 : ex.equipment === 'BODYWEIGHT' ? 12 : 10,
      restSeconds: heavy ? 120 : 75,
      notes: '',
    }]);
  }

  remove(key: number): void {
    this.items.update((list) => list.filter((i) => i.key !== key));
  }

  patch(key: number, change: Partial<Item>): void {
    this.items.update((list) => list.map((i) => (i.key === key ? { ...i, ...change } : i)));
  }

  step(key: number, field: 'sets' | 'reps', delta: number): void {
    const item = this.items().find((i) => i.key === key);
    if (!item) return;
    const max = field === 'sets' ? 10 : 50;
    this.patch(key, { [field]: Math.min(max, Math.max(1, item[field] + delta)) });
  }

  setNumber(key: number, field: 'sets' | 'reps', raw: string): void {
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n)) return;
    this.patch(key, { [field]: Math.min(field === 'sets' ? 10 : 50, Math.max(1, n)) });
  }

  drop(ev: CdkDragDrop<Item[]>): void {
    if (ev.previousIndex === ev.currentIndex) return;
    const next = [...this.items()];
    moveItemInArray(next, ev.previousIndex, ev.currentIndex);
    this.items.set(next);
  }

  restLabel(s: number): string {
    return s < 60 ? `${s}s` : s % 60 ? `${Math.floor(s / 60)}min${s % 60}s` : `${s / 60}min`;
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    if (!this.name().trim()) return;
    if (!this.items().length) {
      this.toast.show('Adicione pelo menos um exercício.');
      this.pickerOpen.set(true);
      return;
    }
    const req: WorkoutRequest = {
      name: this.name().trim(),
      description: this.description().trim() || null,
      letter: this.letter() || null,
      exercises: this.items().map((i) => ({
        exerciseId: i.exercise.id, sets: i.sets, reps: i.reps, restSeconds: i.restSeconds, notes: i.notes.trim() || null,
      })),
    };
    this.saving.set(true);
    try {
      const id = Number(this.id());
      if (id) await this.api.update(id, req);
      else await this.api.create(req);
      this.toast.success(id ? 'Treino atualizado.' : 'Treino criado.');
      await this.router.navigateByUrl('/treinos');
    } catch (err) {
      this.toast.error(err, 'Não foi possível salvar o treino.');
    } finally {
      this.saving.set(false);
    }
  }
}
