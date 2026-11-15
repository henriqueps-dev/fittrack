import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, effect, inject, input, viewChild,
} from '@angular/core';
import {
  BarController, BarElement, CategoryScale, Chart, ChartConfiguration, Filler, LineController, LineElement, LinearScale,
  PointElement, Tooltip,
} from 'chart.js';

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

export interface ChartSeries { label: string; data: number[]; }

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Wrapper fino do Chart.js com o visual do FITTRACK (barras/linhas vermelhas sobre preto).
 * Uma unica serie por grafico: o rotulo do eixo e do tooltip vem de "unit".
 */
@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="box" [style.height.px]="height()"><canvas #canvas role="img" [attr.aria-label]="ariaLabel()"></canvas></div>`,
  styles: `:host { display: block; } .box { position: relative; width: 100%; }`,
})
export class ChartComponent {
  readonly type = input<'bar' | 'line'>('bar');
  readonly labels = input<string[]>([]);
  readonly data = input<number[]>([]);
  readonly unit = input('');
  readonly height = input(180);
  readonly ariaLabel = input('Gráfico');
  /** Indice destacado (ex.: dia atual) nas barras. */
  readonly highlight = input<number | null>(null);
  readonly decimals = input(0);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;

  constructor() {
    afterNextRender(() => this.render());
    effect(() => {
      // Reage a mudancas de dados
      this.labels(); this.data(); this.type(); this.highlight();
      if (this.chart) this.render();
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }

  private render(): void {
    const red = css('--red') || '#e11d2e';
    const grid = css('--border') || '#1f1f23';
    const muted = css('--text-3') || '#71717a';
    const dim = css('--surface-3') || '#232327';
    const unit = this.unit();
    const decimals = this.decimals();
    const hl = this.highlight();
    const data = this.data();
    const fmt = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: decimals })}${unit ? ' ' + unit : ''}`;

    const ctx = this.canvas().nativeElement.getContext('2d')!;
    const fill = ctx.createLinearGradient(0, 0, 0, this.height());
    fill.addColorStop(0, 'rgba(225, 29, 46, 0.28)');
    fill.addColorStop(1, 'rgba(225, 29, 46, 0)');

    const isBar = this.type() === 'bar';
    const config: ChartConfiguration = {
      type: this.type(),
      data: {
        labels: this.labels(),
        datasets: [{
          label: unit,
          data,
          backgroundColor: isBar ? data.map((v, i) => (hl === null || i === hl ? red : v > 0 ? 'rgba(225,29,46,0.55)' : dim)) : fill,
          hoverBackgroundColor: isBar ? red : undefined,
          borderColor: red,
          borderWidth: isBar ? 0 : 2.5,
          borderRadius: isBar ? 6 : 0,
          borderSkipped: false,
          maxBarThickness: 34,
          minBarLength: isBar ? 3 : 0,
          fill: !isBar,
          tension: 0.35,
          pointRadius: isBar ? 0 : data.length > 24 ? 0 : 3.5,
          pointHoverRadius: 6,
          pointBackgroundColor: '#060606',
          pointBorderColor: red,
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 500, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: 6 } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: muted, font: { family: 'Barlow', size: 11 }, maxRotation: 0, autoSkipPadding: 12 },
          },
          y: {
            beginAtZero: true,
            grid: { color: grid },
            border: { display: false },
            ticks: {
              color: muted, font: { family: 'Barlow', size: 11 }, maxTicksLimit: 4, padding: 8,
              callback: (v) => compact(Number(v)),
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#18181b', borderColor: '#2e2e34', borderWidth: 1, padding: 10, cornerRadius: 10,
            titleColor: '#f4f4f5', bodyColor: '#a1a1aa', displayColors: false,
            titleFont: { family: 'Barlow', weight: 600 }, bodyFont: { family: 'Barlow' },
            callbacks: { label: (item) => fmt(Number(item.raw)) },
          },
        },
      },
    };
    this.chart?.destroy();
    this.chart = new Chart(ctx, config);
  }
}

function compact(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}
