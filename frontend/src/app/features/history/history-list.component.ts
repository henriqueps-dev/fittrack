import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarDays, ChevronRight, Clock, History, LucideAngularModule, Weight } from 'lucide-angular';
import { Calendar, SessionSummary } from '../../core/models/api.models';
import { SessionApi, StatsApi } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { duration, volume } from '../../core/utils/format';

interface HeatCell { date: string; level: number; label: string; future: boolean; }

/** Historico: mapa de frequencia (ultimos ~6 meses) + lista paginada de treinos agrupada por mes. */
@Component({
  selector: 'app-history-list',
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head enter">
        <div class="titles">
          <span class="eyebrow">Tudo o que você já fez</span>
          <h1>Histórico</h1>
        </div>
      </header>

      <section class="card heat-card enter enter-1" aria-labelledby="heat-title">
        <div class="section-head">
          <h2 id="heat-title"><lucide-icon [img]="icons.calendar" [size]="18" /> Frequência</h2>
          <span class="faint small num">{{ trainedDays() }} dias treinados em 26 semanas</span>
        </div>
        @if (calendar()) {
          <div class="heat-scroll">
            <div class="heat" role="img" [attr.aria-label]="trainedDays() + ' dias com treino nas últimas 26 semanas'">
              @for (week of weeks(); track $index) {
                <div class="heat-col">
                  @for (c of week; track c.date) {
                    <span class="cell" [class]="'cell l' + c.level" [class.future]="c.future" [title]="c.label"></span>
                  }
                </div>
              }
            </div>
          </div>
          <div class="legend faint" aria-hidden="true">
            Menos <span class="cell l0"></span><span class="cell l1"></span><span class="cell l2"></span><span class="cell l3"></span><span class="cell l4"></span> Mais
          </div>
        } @else {
          <div class="skeleton" style="height: 120px"></div>
        }
      </section>

      @if (loading() && !items().length) {
        @for (i of [1, 2, 3, 4]; track i) { <div class="skeleton" style="height: 84px"></div> }
      } @else if (!items().length) {
        <div class="empty enter enter-2">
          <lucide-icon [img]="icons.history" [size]="30" />
          <h3>Nenhum treino registrado</h3>
          <p>Quando você finalizar um treino, ele aparece aqui com volume, duração e cada série feita.</p>
          <a routerLink="/treinos" class="btn primary">Ir para meus treinos</a>
        </div>
      } @else {
        @for (g of groups(); track g.key) {
          <section class="section enter enter-2">
            <div class="section-head">
              <h2 class="month">{{ g.label }}</h2>
              <span class="faint small num">{{ g.items.length }} treino{{ g.items.length === 1 ? '' : 's' }} · {{ fmt.volume(g.volume) }}</span>
            </div>
            <ul class="card flush list" role="list">
              @for (s of g.items; track s.id) {
                <li>
                  <a class="sess" [routerLink]="['/historico', s.id]">
                    <span class="date">
                      <span class="d num">{{ day(s.startedAt) }}</span>
                      <span class="wd">{{ weekday(s.startedAt) }}</span>
                    </span>
                    <span class="grow">
                      <span class="title">{{ s.workoutName }}</span>
                      <span class="sub">{{ s.exerciseNames.join(' · ') }}</span>
                      <span class="meta">
                        <span><lucide-icon [img]="icons.clock" [size]="13" /> {{ fmt.duration(s.durationSeconds) }}</span>
                        <span><lucide-icon [img]="icons.weight" [size]="13" /> {{ fmt.volume(s.totalVolume) }}</span>
                        <span class="num">{{ s.completedSets }} séries</span>
                      </span>
                    </span>
                    <lucide-icon class="chev" [img]="icons.chev" [size]="18" />
                  </a>
                </li>
              }
            </ul>
          </section>
        }
        @if (hasMore()) {
          <button type="button" class="btn ghost block" (click)="more()" [disabled]="loading()">{{ loading() ? 'Carregando…' : 'Carregar mais' }}</button>
        }
      }
    </div>
  `,
  styles: `
    .small { font-size: 0.82rem; }
    .section-head h2 { display: inline-flex; align-items: center; gap: 8px; }
    .heat-card { display: flex; flex-direction: column; gap: 12px; }
    .heat-scroll { overflow-x: auto; scrollbar-width: thin; padding-bottom: 2px; }
    .heat { display: grid; grid-template-columns: repeat(26, minmax(9px, 1fr)); gap: 3px; min-width: 310px; max-width: 760px; }
    @media (min-width: 900px) { .heat { gap: 5px; } }
    .heat-col { display: grid; grid-template-rows: repeat(7, auto); gap: inherit; }
    .cell { display: block; width: 100%; aspect-ratio: 1; border-radius: 3px; background: var(--surface-3); }
    @media (min-width: 900px) { .cell { border-radius: 4px; } }
    .cell.l1 { background: rgba(225, 29, 46, 0.32); }
    .cell.l2 { background: rgba(225, 29, 46, 0.55); }
    .cell.l3 { background: rgba(225, 29, 46, 0.8); }
    .cell.l4 { background: var(--red); box-shadow: 0 0 10px rgba(225, 29, 46, 0.45); }
    .cell.future { background: transparent; }
    .legend { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; justify-content: flex-end; }
    .legend .cell { width: 11px; height: 11px; aspect-ratio: auto; border-radius: 3px; }

    .month { text-transform: capitalize; }
    .sess {
      display: flex; align-items: center; gap: 14px; padding: 14px 16px; color: inherit; text-decoration: none;
      transition: background-color 160ms var(--ease-out);
    }
    .sess:hover { background: var(--surface-2); }
    .date {
      flex: none; width: 52px; height: 56px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: var(--bg-elev); border: 1px solid var(--border-strong);
    }
    .date .d { font-family: var(--font-display); font-weight: 700; font-size: 1.4rem; line-height: 1; }
    .date .wd { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--red-text); margin-top: 3px; }
    .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .title { font-weight: 600; }
    .sub { font-size: 0.82rem; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 0.8rem; color: var(--text-2); }
    .meta span { display: inline-flex; align-items: center; gap: 4px; }
    .chev { color: var(--text-3); flex: none; }
  `,
})
export class HistoryListComponent {
  private readonly sessions = inject(SessionApi);
  private readonly stats = inject(StatsApi);
  private readonly toast = inject(ToastService);

  protected readonly icons = { calendar: CalendarDays, chev: ChevronRight, clock: Clock, history: History, weight: Weight };
  protected readonly fmt = { duration, volume };

  protected readonly items = signal<SessionSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly calendar = signal<Calendar | null>(null);
  private page = 0;
  private totalPages = 1;
  protected readonly hasMore = signal(false);

  protected readonly groups = computed(() => {
    const map = new Map<string, { key: string; label: string; items: SessionSummary[]; volume: number }>();
    for (const s of this.items()) {
      const d = new Date(s.startedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) {
        const label = d.toLocaleDateString('pt-BR', { month: 'long', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
        map.set(key, { key, label, items: [], volume: 0 });
      }
      const g = map.get(key)!;
      g.items.push(s);
      g.volume += Number(s.totalVolume);
    }
    return [...map.values()];
  });

  protected readonly trainedDays = computed(() => this.calendar()?.days.filter((d) => d.sessions > 0).length ?? 0);

  /** Colunas de semanas (domingo a sabado) cobrindo as ultimas 26 semanas. */
  protected readonly weeks = computed<HeatCell[][]>(() => {
    const cal = this.calendar();
    if (!cal) return [];
    const byDate = new Map(cal.days.map((d) => [d.date, d]));
    const vols = cal.days.filter((d) => d.sessions > 0).map((d) => Number(d.volume)).sort((a, b) => a - b);
    const q = (p: number) => vols[Math.floor((vols.length - 1) * p)] ?? 0;
    const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - 25 * 7);
    const weeks: HeatCell[][] = [];
    for (let w = 0; w < 26; w++) {
      const col: HeatCell[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const p = byDate.get(iso);
        const v = p ? Number(p.volume) : 0;
        const level = !p || !p.sessions ? 0 : v > q3 ? 4 : v > q2 ? 3 : v > q1 ? 2 : 1;
        const human = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        col.push({ date: iso, level, future: date > today, label: p?.sessions ? `${human}: ${p.sessions} treino(s), ${volume(v)}` : `${human}: sem treino` });
      }
      weeks.push(col);
    }
    return weeks;
  });

  constructor() {
    void this.load();
    this.stats.calendar(182).then((c) => this.calendar.set(c)).catch(() => this.calendar.set({ from: '', to: '', days: [] }));
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.sessions.history(this.page, 20);
      this.items.update((list) => [...list, ...res.content]);
      this.totalPages = res.page.totalPages;
      this.hasMore.set(this.page + 1 < this.totalPages);
    } catch (err) {
      this.toast.error(err, 'Não foi possível carregar o histórico.');
    } finally {
      this.loading.set(false);
    }
  }

  more(): void {
    this.page++;
    void this.load();
  }

  day(iso: string): string {
    return String(new Date(iso).getDate()).padStart(2, '0');
  }

  weekday(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  }
}
