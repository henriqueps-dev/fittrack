import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, effect, inject, input, signal, untracked, viewChild,
} from '@angular/core';
import { Equipment, MuscleSlug } from '../../core/models/api.models';
import { BodyRig } from './body-rig';
import { loadHuman } from './human-model';
import { MOVEMENTS, MOVEMENT_FALLBACK } from './movements';
import { StageView, threeStage } from './three-stage';

/**
 * Demonstracao 3D (three.js) de um exercicio com um modelo humano com esqueleto (CC0).
 * A cinematica interpola entre a posicao inicial e final do movimento; o musculo principal fica vermelho
 * e os secundarios em vermelho claro.
 * Pausa fora da tela, respeita prefers-reduced-motion e, com [orbit], pode ser girado arrastando.
 */
@Component({
  selector: 'app-exercise-animation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #cv role="img" [attr.aria-label]="label()" [class.orbit]="orbit()"
            (pointerdown)="onDown($event)" (pointermove)="onMove($event)" (pointerup)="onUp($event)" (pointercancel)="onUp($event)"
            (dblclick)="resetView()"></canvas>
    @if (unsupported()) { <span class="fallback">{{ label() }}</span> }
  `,
  styles: `
    :host { display: block; position: relative; aspect-ratio: 240 / 196; }
    canvas { display: block; width: 100%; height: 100%; }
    canvas.orbit { cursor: grab; touch-action: pan-y; }
    canvas.orbit:active { cursor: grabbing; }
    .fallback {
      position: absolute; inset: 0; display: grid; place-items: center; text-align: center; padding: 8px;
      font-size: 0.8rem; color: var(--text-3);
    }
  `,
})
export class ExerciseAnimationComponent {
  readonly movement = input<string>(MOVEMENT_FALLBACK);
  readonly equipment = input<Equipment>('BODYWEIGHT');
  readonly muscle = input<MuscleSlug | null>(null);
  readonly secondary = input<MuscleSlug[]>([]);
  readonly playing = input(true);
  readonly label = input('Demonstração do exercício');
  /** Enquadra a camera no boneco, sem aparelhos ao redor (miniaturas). */
  readonly fit = input(false);
  /** Permite girar a camera arrastando. */
  readonly orbit = input(false);

  protected readonly unsupported = signal(false);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private readonly host = inject(ElementRef<HTMLElement>);

  private rig: BodyRig | null = null;
  private view: StageView | null = null;
  private visible = false;
  private dirty = true;
  private reduceMotion = false;
  private elapsed = 0;
  private lastNow = 0;
  private drag: { id: number; x: number; y: number } | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      // reconstroi a cena quando o exercicio muda (ex.: vitrine rotativa do login)
      this.movement(); this.equipment(); this.muscle(); this.secondary();
      untracked(() => { if (this.view) void this.build(); });
    });
    effect(() => {
      this.playing();
      this.dirty = true;
    });

    afterNextRender(() => {
      if (!threeStage.available) {
        this.unsupported.set(true);
        return;
      }
      this.reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      const canvas = this.canvasRef().nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) { this.unsupported.set(true); return; }

      void this.build();
      const self = this;
      this.view = {
        canvas,
        ctx,
        get scene() { return self.rig!.scene; },
        get camera() { return self.rig!.camera; },
        wantsFrame: (now) => this.wantsFrame(now),
        beforeRender: (now) => this.beforeRender(now),
      };

      const ro = new ResizeObserver(() => this.resize());
      ro.observe(canvas);
      const io = new IntersectionObserver(([e]) => {
        this.visible = e.isIntersecting;
        if (this.visible) this.dirty = true;
      }, { rootMargin: '120px' });
      io.observe(this.host.nativeElement);
      this.resize();
      threeStage.register(this.view);

      destroyRef.onDestroy(() => {
        this.destroyed = true;
        ro.disconnect();
        io.disconnect();
        if (this.view) threeStage.unregister(this.view);
        this.rig?.dispose();
      });
    });
  }

  private buildToken = 0;
  private destroyed = false;

  private async build(): Promise<void> {
    const token = ++this.buildToken;
    let asset;
    try {
      asset = await loadHuman();
    } catch (err) {
      console.error('[exercise-animation] falha ao carregar o modelo 3D', err);
      this.unsupported.set(true);
      return;
    }
    if (token !== this.buildToken || this.destroyed) return;
    const prevAspect = this.canvasAspect();
    this.rig?.dispose();
    const key = this.movement() in MOVEMENTS ? this.movement() : MOVEMENT_FALLBACK;
    this.rig = new BodyRig(asset, key, this.equipment(), this.muscle(), this.secondary(), {
      shadows: !this.fit(),
      fit: this.fit(),
      orbit: this.orbit(),
    });
    if (prevAspect) this.rig.setAspect(prevAspect);
    this.elapsed = (MOVEMENTS[key].period ?? 2600) * 0.32;
    this.dirty = true;
  }

  private canvasAspect(): number | null {
    const c = this.canvasRef().nativeElement;
    return c.width && c.height ? c.width / c.height : null;
  }

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, this.fit() ? 1.5 : 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    this.rig?.setAspect(w / h);
    this.dirty = true;
  }

  private animating(): boolean {
    return this.playing() && !this.reduceMotion;
  }

  private wantsFrame(_now: number): boolean {
    const want = this.rig !== null && this.visible && (this.dirty || this.animating() || this.drag !== null);
    if (!want) this.lastNow = 0;
    return want;
  }

  private beforeRender(now: number): void {
    if (!this.rig) return;
    const period = MOVEMENTS[this.movement()]?.period ?? 2600;
    if (this.animating()) {
      if (this.lastNow) this.elapsed += Math.min(100, now - this.lastNow);
      this.lastNow = now;
    } else {
      this.lastNow = 0;
    }
    const t = (this.elapsed % period) / period;
    // 0 -> 1 -> 0 com pequenas pausas nos extremos
    const wave = (1 - Math.cos(2 * Math.PI * t)) / 2;
    this.rig.update(this.reduceMotion ? 0.6 : Math.min(1, Math.max(0, (wave - 0.06) / 0.88)));
    this.dirty = false;
  }

  /* ---------------------------------------------------------------- orbita */

  protected onDown(ev: PointerEvent): void {
    if (!this.orbit()) return;
    this.drag = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
  }

  protected onMove(ev: PointerEvent): void {
    if (!this.drag || ev.pointerId !== this.drag.id || !this.rig) return;
    const dx = ev.clientX - this.drag.x;
    const dy = ev.clientY - this.drag.y;
    this.drag.x = ev.clientX;
    this.drag.y = ev.clientY;
    this.rig.orbitBy(-dx * 0.45, dy * 0.25);
    this.dirty = true;
  }

  protected onUp(ev: PointerEvent): void {
    if (this.drag?.id === ev.pointerId) this.drag = null;
  }

  protected resetView(): void {
    if (!this.orbit() || !this.rig) return;
    this.rig.resetView();
    this.dirty = true;
  }
}
