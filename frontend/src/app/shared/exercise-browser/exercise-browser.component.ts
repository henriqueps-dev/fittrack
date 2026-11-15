import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Check, Heart, LucideAngularModule, Plus, Search, X } from 'lucide-angular';
import { Equipment, Exercise, MuscleGroup, MuscleSlug } from '../../core/models/api.models';
import { ExerciseApi } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { DIFFICULTY_LABEL, EQUIPMENT_LABEL, MUSCLE_ORDER } from '../../core/utils/format';
import { ExerciseAnimationComponent } from '../exercise-animation/exercise-animation.component';
import { MuscleMapComponent } from '../muscle-map/muscle-map.component';

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/**
 * Navegador da biblioteca: mapa muscular + filtros (grupo, equipamento, busca, favoritos).
 * Em modo "selecao" (montagem de treino) cada item pode ser adicionado/removido.
 */
@Component({
  selector: 'app-exercise-browser',
  imports: [RouterLink, LucideAngularModule, MuscleMapComponent, ExerciseAnimationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exercise-browser.component.html',
  styleUrl: './exercise-browser.component.scss',
})
export class ExerciseBrowserComponent {
  private readonly api = inject(ExerciseApi);
  private readonly toast = inject(ToastService);

  /** Modo selecao: mostra botao de adicionar em vez de navegar para o detalhe. */
  readonly selectable = input(false);
  readonly selectedIds = input<number[]>([]);
  /** Restringe os grupos exibidos (ex.: grupos escolhidos na montagem do treino). */
  readonly allowedMuscles = input<MuscleSlug[] | null>(null);
  readonly muscle = model<MuscleSlug | null>(null);
  readonly toggled = output<Exercise>();

  protected readonly icons = { search: Search, heart: Heart, plus: Plus, check: Check, x: X };
  protected readonly eqLabel = EQUIPMENT_LABEL;
  protected readonly diffLabel = DIFFICULTY_LABEL;
  protected readonly equipments = Object.keys(EQUIPMENT_LABEL) as Equipment[];

  protected readonly all = signal<Exercise[]>([]);
  protected readonly groups = signal<MuscleGroup[]>([]);
  protected readonly loading = signal(true);
  protected readonly query = signal('');
  protected readonly equipment = signal<Equipment | ''>('');
  protected readonly onlyFavorites = signal(false);
  protected readonly view = signal<'front' | 'back'>('front');
  protected readonly hoveredId = signal<number | null>(null);

  protected readonly visibleGroups = computed(() => {
    const allowed = this.allowedMuscles();
    return this.groups()
      .filter((g) => !allowed || allowed.includes(g.slug))
      .sort((a, b) => MUSCLE_ORDER.indexOf(a.slug) - MUSCLE_ORDER.indexOf(b.slug));
  });

  protected readonly filtered = computed(() => {
    const m = this.muscle();
    const eq = this.equipment();
    const q = fold(this.query());
    const allowed = this.allowedMuscles();
    return this.all().filter((e) =>
      (!m || e.primaryMuscle.slug === m)
      && (!allowed || allowed.includes(e.primaryMuscle.slug))
      && (!eq || e.equipment === eq)
      && (!this.onlyFavorites() || e.favorite)
      && (!q || fold(e.name).includes(q)));
  });

  protected readonly hoveredSecondary = computed<MuscleSlug[]>(() => {
    const id = this.hoveredId();
    const ex = id ? this.all().find((e) => e.id === id) : null;
    return ex ? ex.secondaryMuscles.map((s) => s.slug) : [];
  });

  constructor() {
    void this.load();
    effect(() => {
      const v = MuscleMapComponent.viewFor(this.muscle());
      if (v) this.view.set(v);
    });
  }

  private async load(): Promise<void> {
    try {
      const [ex, groups] = await Promise.all([this.api.all(), this.api.muscleGroups()]);
      this.all.set(ex);
      this.groups.set(groups);
    } catch (err) {
      this.toast.error(err, 'Não foi possível carregar os exercícios.');
    } finally {
      this.loading.set(false);
    }
  }

  selectMuscle(m: MuscleSlug | null): void {
    this.muscle.set(this.muscle() === m ? null : m);
  }

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  async toggleFavorite(ex: Exercise, ev: Event): Promise<void> {
    ev.preventDefault();
    ev.stopPropagation();
    const next = !ex.favorite;
    this.patch(ex.id, next);
    try {
      await this.api.setFavorite(ex.id, next);
    } catch (err) {
      this.patch(ex.id, !next);
      this.toast.error(err, 'Não foi possível atualizar o favorito.');
    }
  }

  clearFilters(): void {
    this.muscle.set(null);
    this.equipment.set('');
    this.query.set('');
    this.onlyFavorites.set(false);
  }

  private patch(id: number, favorite: boolean): void {
    this.all.update((list) => list.map((e) => (e.id === id ? { ...e, favorite } : e)));
  }
}
