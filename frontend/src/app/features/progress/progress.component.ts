import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Crown, Dumbbell, Flag, Flame, LineChart, LucideAngularModule, LucideIconData, Mountain, Repeat, Target, Timer, Trophy, Weight, Zap,
} from 'lucide-angular';
import { Achievement, ExerciseProgress, Overview, RangeCode, RecordDto, TrainedExercise } from '../../core/models/api.models';
import { StatsApi } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { RECORD_LABEL, duration, kg, relativeDay, shortDate, volume } from '../../core/utils/format';
import { ChartComponent } from '../../shared/chart/chart.component';

const ACH_ICONS: Record<string, LucideIconData> = {
  flag: Flag, repeat: Repeat, dumbbell: Dumbbell, crown: Crown, weight: Weight, mountain: Mountain,
  timer: Timer, target: Target, flame: Flame, trophy: Trophy, zap: Zap,
};

type Metric = 'maxWeight' | 'estimated1Rm' | 'volume';

/** Evolucao: resumo do periodo, volume semanal, distribuicao por musculo, progresso de carga, recordes e conquistas. */
@Component({
  selector: 'app-progress',
  imports: [RouterLink, LucideAngularModule, ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
})
export class ProgressComponent {
  private readonly api = inject(StatsApi);
  private readonly toast = inject(ToastService);

  protected readonly icons = { chart: LineChart, trophy: Trophy, dumbbell: Dumbbell };
  protected readonly achIcon = (name: string) => ACH_ICONS[name] ?? Trophy;
  protected readonly fmt = { duration, kg, relativeDay, shortDate, volume };
  protected readonly recordLabel = RECORD_LABEL;
  protected readonly ranges: { code: RangeCode; label: string }[] = [
    { code: '7d', label: '7 dias' }, { code: '30d', label: '30 dias' }, { code: '3m', label: '3 meses' },
    { code: '6m', label: '6 meses' }, { code: 'all', label: 'Tudo' },
  ];
  protected readonly metrics: { code: Metric; label: string; unit: string }[] = [
    { code: 'maxWeight', label: 'Carga máx.', unit: 'kg' },
    { code: 'estimated1Rm', label: '1RM estimado', unit: 'kg' },
    { code: 'volume', label: 'Volume', unit: 'kg' },
  ];

  protected readonly range = signal<RangeCode>('3m');
  protected readonly weeklyMode = signal<'volume' | 'sessions'>('volume');
  protected readonly overview = signal<Overview | null>(null);
  protected readonly trained = signal<TrainedExercise[]>([]);
  protected readonly exerciseId = signal<number | null>(null);
  protected readonly metric = signal<Metric>('maxWeight');
  protected readonly progress = signal<ExerciseProgress | null>(null);
  protected readonly records = signal<RecordDto[]>([]);
  protected readonly achievements = signal<Achievement[]>([]);
  protected readonly loading = signal(true);

  protected readonly weeklyLabels = computed(() => this.overview()?.weekly.map((w) => shortDate(w.weekStart)) ?? []);
  protected readonly weeklyData = computed(() =>
    this.overview()?.weekly.map((w) => (this.weeklyMode() === 'volume' ? Number(w.volume) : w.sessions)) ?? []);
  protected readonly shareMax = computed(() => Math.max(1, ...(this.overview()?.muscleShare.map((m) => m.sets) ?? [])));
  protected readonly shareTotal = computed(() => (this.overview()?.muscleShare ?? []).reduce((a, m) => a + m.sets, 0));

  protected readonly progLabels = computed(() => this.progress()?.points.map((p) => shortDate(p.date)) ?? []);
  protected readonly progData = computed(() => this.progress()?.points.map((p) => Number(p[this.metric()])) ?? []);
  protected readonly bestRecords = computed(() => {
    // um recorde (o mais recente de maior valor) por exercicio e tipo de carga maxima
    const map = new Map<number, RecordDto>();
    for (const r of this.records().filter((x) => x.type === 'MAX_WEIGHT')) {
      const cur = map.get(r.exercise.id);
      if (!cur || Number(r.value) > Number(cur.value)) map.set(r.exercise.id, r);
    }
    return [...map.values()].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)).slice(0, 8);
  });
  protected readonly unlockedCount = computed(() => this.achievements().filter((a) => a.unlocked).length);

  constructor() {
    effect(() => {
      const r = this.range();
      untracked(() => void this.loadOverview(r));
    });
    effect(() => {
      const id = this.exerciseId();
      const r = this.range();
      if (id) untracked(() => void this.loadProgress(id, r));
    });
    void this.loadStatic();
  }

  private async loadOverview(r: RangeCode): Promise<void> {
    try {
      this.overview.set(await this.api.overview(r));
    } catch (err) {
      this.toast.error(err, 'Não foi possível carregar suas estatísticas.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadStatic(): Promise<void> {
    const [trained, records, ach] = await Promise.allSettled([this.api.trainedExercises(), this.api.records(), this.api.achievements()]);
    if (trained.status === 'fulfilled') {
      this.trained.set(trained.value);
      if (trained.value.length) this.exerciseId.set(trained.value[0].id);
    }
    if (records.status === 'fulfilled') this.records.set(records.value);
    if (ach.status === 'fulfilled') this.achievements.set(ach.value);
  }

  private async loadProgress(id: number, r: RangeCode): Promise<void> {
    try {
      this.progress.set(await this.api.exerciseProgress(id, r));
    } catch (err) {
      this.toast.error(err, 'Não foi possível carregar a evolução do exercício.');
    }
  }

  metricUnit(): string {
    return this.metrics.find((m) => m.code === this.metric())!.unit;
  }

  signed(n: number): string {
    return `${n > 0 ? '+' : n < 0 ? '−' : ''}${kg(Math.abs(n))}`;
  }
}
