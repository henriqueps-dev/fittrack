import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArrowLeft, Heart, ListChecks, LucideAngularModule, Pause, Play, Plus, Trophy } from 'lucide-angular';
import { Exercise, ExerciseProgress, MuscleSlug, Workout } from '../../core/models/api.models';
import { ExerciseApi, StatsApi, WorkoutApi } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { DIFFICULTY_LABEL, EQUIPMENT_LABEL, RECORD_LABEL, kg, shortDate } from '../../core/utils/format';
import { ChartComponent } from '../../shared/chart/chart.component';
import { ExerciseAnimationComponent } from '../../shared/exercise-animation/exercise-animation.component';
import { MuscleMapComponent } from '../../shared/muscle-map/muscle-map.component';

@Component({
  selector: 'app-exercise-detail',
  imports: [RouterLink, LucideAngularModule, ExerciseAnimationComponent, MuscleMapComponent, ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exercise-detail.component.html',
  styleUrl: './exercise-detail.component.scss',
})
export class ExerciseDetailComponent {
  private readonly api = inject(ExerciseApi);
  private readonly stats = inject(StatsApi);
  private readonly workoutsApi = inject(WorkoutApi);
  private readonly toast = inject(ToastService);
  protected readonly location = inject(Location);

  readonly id = input.required<string>();

  protected readonly icons = { back: ArrowLeft, heart: Heart, play: Play, pause: Pause, plus: Plus, trophy: Trophy, list: ListChecks };
  protected readonly eqLabel = EQUIPMENT_LABEL;
  protected readonly diffLabel = DIFFICULTY_LABEL;
  protected readonly recordLabel = RECORD_LABEL;
  protected readonly fmt = { kg, shortDate };

  protected readonly exercise = signal<Exercise | null>(null);
  protected readonly progress = signal<ExerciseProgress | null>(null);
  protected readonly playing = signal(true);
  protected readonly sheetOpen = signal(false);
  protected readonly workouts = signal<Workout[]>([]);
  protected readonly adding = signal<number | null>(null);

  protected readonly secondary = computed<MuscleSlug[]>(() => this.exercise()?.secondaryMuscles.map((m) => m.slug) ?? []);
  protected readonly chartLabels = computed(() => this.progress()?.points.map((p) => shortDate(p.date)) ?? []);
  protected readonly chartData = computed(() => this.progress()?.points.map((p) => Number(p.maxWeight)) ?? []);
  protected readonly last = computed(() => {
    const pts = this.progress()?.points ?? [];
    return pts.length ? pts[pts.length - 1] : null;
  });

  constructor() {
    effect(() => {
      const id = Number(this.id());
      if (Number.isFinite(id)) void this.load(id);
    });
  }

  private async load(id: number): Promise<void> {
    this.exercise.set(null);
    this.progress.set(null);
    try {
      this.exercise.set(await this.api.get(id));
      this.progress.set(await this.stats.exerciseProgress(id, 'all'));
    } catch (err) {
      this.toast.error(err, 'Não foi possível carregar o exercício.');
    }
  }

  async toggleFavorite(): Promise<void> {
    const ex = this.exercise();
    if (!ex) return;
    const next = !ex.favorite;
    this.exercise.set({ ...ex, favorite: next });
    try {
      await this.api.setFavorite(ex.id, next);
      this.toast.show(next ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'success', 2000);
    } catch (err) {
      this.exercise.set({ ...ex, favorite: !next });
      this.toast.error(err);
    }
  }

  async openAddSheet(): Promise<void> {
    this.sheetOpen.set(true);
    try {
      this.workouts.set(await this.workoutsApi.list());
    } catch (err) {
      this.toast.error(err, 'Não foi possível carregar seus treinos.');
    }
  }

  async addTo(w: Workout): Promise<void> {
    const ex = this.exercise();
    if (!ex) return;
    if (w.exercises.some((e) => e.exercise.id === ex.id)) {
      this.toast.show(`Este exercício já está em "${w.name}".`);
      return;
    }
    this.adding.set(w.id);
    try {
      await this.workoutsApi.update(w.id, {
        name: w.name,
        description: w.description ?? null,
        letter: w.letter ?? null,
        exercises: [
          ...w.exercises.map((e) => ({ exerciseId: e.exercise.id, sets: e.sets, reps: e.reps, restSeconds: e.restSeconds, notes: e.notes ?? null })),
          { exerciseId: ex.id, sets: 3, reps: 10, restSeconds: 90, notes: null },
        ],
      });
      this.toast.success(`${ex.name} adicionado a "${w.name}".`);
      this.sheetOpen.set(false);
    } catch (err) {
      this.toast.error(err, 'Não foi possível adicionar ao treino.');
    } finally {
      this.adding.set(null);
    }
  }
}
