import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  Clock, Copy, Dumbbell, EllipsisVertical, GripVertical, Layers, LucideAngularModule, Pencil, Play, Plus, Trash2,
} from 'lucide-angular';
import { Workout } from '../../core/models/api.models';
import { WorkoutApi } from '../../core/services/api.services';
import { SessionStore } from '../../core/services/session.store';
import { ToastService } from '../../core/services/toast.service';
import { relativeDay } from '../../core/utils/format';

type SplitType = 'ABC' | 'ABCD' | 'ABCDE';

@Component({
  selector: 'app-workout-list',
  imports: [RouterLink, LucideAngularModule, CdkDropList, CdkDrag, CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workout-list.component.html',
  styleUrl: './workout-list.component.scss',
})
export class WorkoutListComponent {
  private readonly api = inject(WorkoutApi);
  private readonly store = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly icons = {
    plus: Plus, play: Play, edit: Pencil, copy: Copy, trash: Trash2, grip: GripVertical, more: EllipsisVertical,
    clock: Clock, dumbbell: Dumbbell, layers: Layers,
  };
  protected readonly relativeDay = relativeDay;
  protected readonly workouts = signal<Workout[]>([]);
  protected readonly loading = signal(true);
  protected readonly menuFor = signal<number | null>(null);
  protected readonly confirmDelete = signal<Workout | null>(null);
  protected readonly splitOpen = signal(false);
  protected readonly busy = signal(false);
  protected readonly startingId = signal<number | null>(null);

  protected readonly splits: { type: SplitType; title: string; days: string[] }[] = [
    { type: 'ABC', title: '3 treinos', days: ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas e Ombros'] },
    { type: 'ABCD', title: '4 treinos', days: ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas', 'Ombros e Abdômen'] },
    { type: 'ABCDE', title: '5 treinos', days: ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços e Abdômen'] },
  ];

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.workouts.set(await this.api.list());
    } catch (err) {
      this.toast.error(err, 'Não foi possível carregar seus treinos.');
    } finally {
      this.loading.set(false);
    }
  }

  async start(w: Workout): Promise<void> {
    if (!w.exercises.length) {
      this.toast.show('Adicione exercícios a este treino antes de iniciar.');
      return;
    }
    const active = this.store.active();
    if (active && active.workoutId !== w.id) {
      this.toast.show(`Finalize "${active.workoutName}" antes de iniciar outro treino.`);
      await this.router.navigateByUrl('/treino-ativo');
      return;
    }
    this.startingId.set(w.id);
    try {
      await this.store.start(w);
      await this.router.navigateByUrl('/treino-ativo');
    } catch (err) {
      this.toast.error(err, 'Não foi possível iniciar o treino.');
    } finally {
      this.startingId.set(null);
    }
  }

  async duplicate(w: Workout): Promise<void> {
    this.menuFor.set(null);
    try {
      const copy = await this.api.duplicate(w.id);
      this.workouts.update((list) => [...list, copy]);
      this.toast.success('Treino duplicado.');
    } catch (err) {
      this.toast.error(err, 'Não foi possível duplicar.');
    }
  }

  askDelete(w: Workout): void {
    this.menuFor.set(null);
    this.confirmDelete.set(w);
  }

  async remove(): Promise<void> {
    const w = this.confirmDelete();
    if (!w) return;
    this.busy.set(true);
    try {
      await this.api.delete(w.id);
      this.workouts.update((list) => list.filter((x) => x.id !== w.id));
      this.toast.success('Treino excluído.');
      this.confirmDelete.set(null);
    } catch (err) {
      this.toast.error(err, 'Não foi possível excluir.');
    } finally {
      this.busy.set(false);
    }
  }

  async drop(ev: CdkDragDrop<Workout[]>): Promise<void> {
    if (ev.previousIndex === ev.currentIndex) return;
    const before = this.workouts();
    const next = [...before];
    moveItemInArray(next, ev.previousIndex, ev.currentIndex);
    this.workouts.set(next);
    try {
      await this.api.reorder(next.map((w) => w.id));
    } catch (err) {
      this.workouts.set(before);
      this.toast.error(err, 'Não foi possível reordenar.');
    }
  }

  async createSplit(type: SplitType): Promise<void> {
    this.busy.set(true);
    try {
      this.workouts.set(await this.api.createSplit(type));
      this.splitOpen.set(false);
      this.toast.success(`Divisão ${type} criada. Ajuste os exercícios como quiser.`);
    } catch (err) {
      this.toast.error(err, 'Não foi possível criar a divisão.');
    } finally {
      this.busy.set(false);
    }
  }

  toggleMenu(id: number, ev: Event): void {
    ev.stopPropagation();
    this.menuFor.set(this.menuFor() === id ? null : id);
  }
}
