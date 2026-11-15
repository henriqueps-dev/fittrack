import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MuscleSlug } from '../../core/models/api.models';
import { BrandMarkComponent } from '../../shared/brand-mark.component';
import { ExerciseAnimationComponent } from '../../shared/exercise-animation/exercise-animation.component';

const SHOWCASE: { movement: string; muscle: MuscleSlug; label: string; equipment: 'BARBELL' | 'DUMBBELL' | 'BODYWEIGHT' }[] = [
  { movement: 'SQUAT', muscle: 'quads', label: 'Agachamento livre', equipment: 'BARBELL' },
  { movement: 'PRESS_FLAT', muscle: 'chest', label: 'Supino reto', equipment: 'BARBELL' },
  { movement: 'CURL', muscle: 'biceps', label: 'Rosca direta', equipment: 'DUMBBELL' },
  { movement: 'PULLUP', muscle: 'back', label: 'Barra fixa', equipment: 'BODYWEIGHT' },
];

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, BrandMarkComponent, ExerciseAnimationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <section class="hero" aria-hidden="true">
        <app-brand-mark [size]="34" />
        <div class="stage">
          <app-exercise-animation [movement]="current().movement" [muscle]="current().muscle" [equipment]="current().equipment" />
          <span class="caption num">{{ current().label }}</span>
        </div>
        <div class="pitch">
          <h1>Cada série<br /><span>conta.</span></h1>
          <p>Monte seus treinos, registre a carga de cada série e veja a evolução semana após semana.</p>
        </div>
      </section>
      <main class="panel">
        <div class="mobile-brand"><app-brand-mark /></div>
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .wrap { min-height: 100dvh; display: grid; }
    .hero { display: none; }
    .panel {
      display: flex; flex-direction: column; justify-content: center; gap: 28px;
      width: 100%; max-width: 440px; margin: 0 auto;
      padding: calc(32px + var(--safe-t)) 16px calc(32px + var(--safe-b));
    }
    .mobile-brand { display: flex; }
    @media (min-width: 960px) {
      .wrap { grid-template-columns: 1.1fr 1fr; }
      .mobile-brand { display: none; }
      .hero {
        display: flex; flex-direction: column; justify-content: space-between; gap: 32px;
        padding: 40px 48px;
        border-right: 1px solid var(--border);
        background:
          radial-gradient(80% 60% at 30% 60%, rgba(225, 29, 46, 0.10), transparent 70%),
          var(--bg-elev);
        overflow: hidden;
      }
      .stage { position: relative; width: 100%; max-width: 520px; aspect-ratio: 240 / 196; align-self: center; }
      .caption {
        position: absolute; left: 0; bottom: -6px; font-size: 0.85rem; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--text-3);
      }
      .pitch { display: flex; flex-direction: column; gap: 14px; max-width: 440px; }
      .pitch h1 { font-size: 4rem; line-height: 0.92; }
      .pitch h1 span { color: var(--red-text); }
      .pitch p { color: var(--text-2); font-size: 1.05rem; }
    }
  `,
})
export class AuthLayoutComponent implements OnDestroy {
  private index = 0;
  protected readonly current = signal(SHOWCASE[0]);
  private readonly timer = setInterval(() => {
    this.index = (this.index + 1) % SHOWCASE.length;
    this.current.set(SHOWCASE[this.index]);
  }, 5200);

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
