import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChevronRight, Clock, Dumbbell, Flame, LucideAngularModule, Play, Plus, Weight } from 'lucide-angular';
import { Dashboard, Workout } from '../../core/models/api.models';
import { StatsApi, WorkoutApi } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { SessionStore } from '../../core/services/session.store';
import { ToastService } from '../../core/services/toast.service';
import { duration, greeting, relativeDay, volume } from '../../core/utils/format';
import { ChartComponent } from '../../shared/chart/chart.component';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, LucideAngularModule, ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly stats = inject(StatsApi);
  private readonly workoutsApi = inject(WorkoutApi);
  private readonly store = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly icons = { play: Play, plus: Plus, chevron: ChevronRight, clock: Clock, weight: Weight, flame: Flame, dumbbell: Dumbbell };
  protected readonly data = signal<Dashboard | null>(null);
  protected readonly workouts = signal<Workout[]>([]);
  protected readonly loading = signal(true);
  protected readonly starting = signal(false);
  protected readonly greeting = greeting();
  protected readonly fmt = { duration, volume, relativeDay };
  protected readonly dayLabels = DAYS;

  protected readonly firstName = computed(() => (this.data()?.userName ?? this.auth.user()?.name ?? '').split(' ')[0]);
  protected readonly goalRatio = computed(() => {
    const d = this.data();
    return d ? Math.min(1, d.weekSessions / Math.max(1, d.weeklyGoal)) : 0;
  });
  protected readonly todayIndex = (new Date().getDay() + 6) % 7;
  protected readonly weekVolumes = computed(() => this.data()?.week.map((d) => Number(d.volume)) ?? []);
  protected readonly trainedDays = computed(() => this.data()?.week.map((d) => d.sessions > 0) ?? []);
  protected readonly active = this.store.active;

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const [d, w] = await Promise.all([this.stats.dashboard(), this.workoutsApi.list()]);
      this.data.set(d);
      this.workouts.set(w);
    } catch (err) {
      this.toast.error(err, 'Não foi possível carregar o painel.');
    } finally {
      this.loading.set(false);
    }
  }

  async startNext(): Promise<void> {
    if (this.store.active()) {
      await this.router.navigateByUrl('/treino-ativo');
      return;
    }
    const next = this.data()?.nextWorkout;
    const workout = this.workouts().find((w) => w.id === next?.id);
    if (!workout) {
      await this.router.navigateByUrl('/treinos');
      return;
    }
    this.starting.set(true);
    try {
      await this.store.start(workout);
      await this.router.navigateByUrl('/treino-ativo');
    } catch (err) {
      this.toast.error(err, 'Não foi possível iniciar o treino.');
    } finally {
      this.starting.set(false);
    }
  }
}
