import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { MuscleSlug } from '../../core/models/api.models';
import { MUSCLE_LABEL } from '../../core/utils/format';
import { BACK_PARTS, FRONT_PARTS, MusclePart, NEUTRAL_BACK, NEUTRAL_FRONT, mirror } from './muscle-paths';

interface RenderedPart { muscle: MuscleSlug; d: string; }

const FRONT_ONLY: MuscleSlug[] = ['chest', 'biceps', 'abs', 'quads'];
const BACK_ONLY: MuscleSlug[] = ['back', 'triceps', 'glutes', 'hamstrings'];

function expand(parts: MusclePart[]): RenderedPart[] {
  return parts.flatMap((p) => [{ muscle: p.muscle, d: p.d }, { muscle: p.muscle, d: mirror(p.d) }]);
}

/**
 * Mapa muscular interativo (frente e costas) em SVG. Clique/toque ou teclado (Enter/Espaco)
 * seleciona o grupo; o musculo selecionado fica em vermelho e os secundarios em vermelho translucido.
 */
@Component({
  selector: 'app-muscle-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map" [class.compact]="compact()">
      @if (showToggle()) {
        <div class="segmented toggle" role="tablist" aria-label="Vista do corpo">
          <button type="button" role="tab" [class.on]="view() === 'front'" [attr.aria-selected]="view() === 'front'" (click)="view.set('front')">Frente</button>
          <button type="button" role="tab" [class.on]="view() === 'back'" [attr.aria-selected]="view() === 'back'" (click)="view.set('back')">Costas</button>
        </div>
      }
      <div class="figures" [class.both]="both()">
        @for (side of sides(); track side) {
          <svg viewBox="0 0 200 420" class="body" [attr.aria-label]="side === 'front' ? 'Corpo de frente' : 'Corpo de costas'" role="group">
            <defs>
              <filter [attr.id]="gid + side" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            @for (d of neutral(side); track $index) {
              <path [attr.d]="d" class="neutral" />
            }
            @for (p of parts(side); track $index) {
              <path
                [attr.d]="p.d"
                class="muscle"
                [class.selected]="p.muscle === selected()"
                [class.secondary]="secondary().includes(p.muscle)"
                [class.hovered]="p.muscle === hovered()"
                [class.interactive]="interactive()"
                [attr.filter]="p.muscle === selected() ? 'url(#' + gid + side + ')' : null"
                (click)="pick(p.muscle)"
                (mouseenter)="hovered.set(p.muscle)"
                (mouseleave)="hovered.set(null)"
              />
            }
            <!-- alvos acessiveis por teclado: um por grupo visivel nesta vista -->
            @if (interactive()) {
              @for (m of focusables(side); track m) {
                <path [attr.d]="firstPath(side, m)" class="focus-target" tabindex="0" role="button"
                      [attr.aria-label]="label(m)" [attr.aria-pressed]="m === selected()"
                      (keydown.enter)="pick(m)" (keydown.space)="$event.preventDefault(); pick(m)"
                      (focus)="hovered.set(m)" (blur)="hovered.set(null)" (click)="pick(m)" />
              }
            }
          </svg>
        }
      </div>
      @if (showLabel()) {
        <p class="caption" aria-live="polite">
          @if (hovered() ?? selected(); as m) {
            <span class="dot"></span>{{ label(m) }}
          } @else {
            Toque em um músculo
          }
        </p>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .map { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .figures { display: flex; justify-content: center; gap: 4%; width: 100%; }
    .body { width: 100%; max-width: 230px; height: auto; overflow: visible; }
    .figures.both .body { width: 48%; }
    .compact .body { max-width: 140px; }
    .neutral { fill: var(--surface-2); }
    .muscle {
      fill: var(--muscle);
      stroke: var(--muscle-stroke); stroke-width: 1.5; stroke-linejoin: round;
      transition: fill 220ms var(--ease-out), opacity 220ms;
    }
    .muscle.interactive { cursor: pointer; }
    .muscle.interactive.hovered { fill: var(--muscle-hover); }
    .muscle.secondary { fill: rgba(225, 29, 46, 0.38); }
    .muscle.selected { fill: var(--red); animation: pulse 2.4s var(--ease-in-out) infinite; }
    .focus-target { fill: transparent; outline: none; pointer-events: none; }
    .focus-target:focus-visible { stroke: var(--text); stroke-width: 2; stroke-dasharray: 3 3; }
    .caption {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: var(--font-display); font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.9rem;
      color: var(--text-2); min-height: 1.4em;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--red); }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.78; } }
  `,
})
export class MuscleMapComponent {
  readonly selected = input<MuscleSlug | null>(null);
  readonly secondary = input<MuscleSlug[]>([]);
  readonly interactive = input(true);
  readonly both = input(false);
  readonly showToggle = input(true);
  readonly showLabel = input(true);
  readonly compact = input(false);
  readonly view = model<'front' | 'back'>('front');
  readonly selectedChange = output<MuscleSlug>();

  protected readonly hovered = signal<MuscleSlug | null>(null);
  protected readonly gid = `mm${Math.random().toString(36).slice(2, 8)}`;
  private readonly front = expand(FRONT_PARTS);
  private readonly back = expand(BACK_PARTS);

  protected readonly sides = computed<('front' | 'back')[]>(() => (this.both() ? ['front', 'back'] : [this.view()]));

  parts(side: 'front' | 'back'): RenderedPart[] {
    return side === 'front' ? this.front : this.back;
  }

  neutral(side: 'front' | 'back'): string[] {
    const base = side === 'front' ? NEUTRAL_FRONT : NEUTRAL_BACK;
    return [...base, ...base.slice(2).map(mirror)];
  }

  focusables(side: 'front' | 'back'): MuscleSlug[] {
    return [...new Set(this.parts(side).map((p) => p.muscle))];
  }

  firstPath(side: 'front' | 'back', m: MuscleSlug): string {
    return this.parts(side).filter((p) => p.muscle === m).map((p) => p.d).join(' ');
  }

  label(m: MuscleSlug): string {
    return MUSCLE_LABEL[m];
  }

  pick(m: MuscleSlug): void {
    if (!this.interactive()) return;
    this.selectedChange.emit(m);
  }

  /** Mostra automaticamente a vista onde o musculo aparece. */
  static viewFor(m: MuscleSlug | null): 'front' | 'back' | null {
    if (!m) return null;
    if (FRONT_ONLY.includes(m)) return 'front';
    if (BACK_ONLY.includes(m)) return 'back';
    return null;
  }
}
