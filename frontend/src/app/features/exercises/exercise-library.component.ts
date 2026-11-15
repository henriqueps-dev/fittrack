import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MuscleSlug } from '../../core/models/api.models';
import { MUSCLE_ORDER } from '../../core/utils/format';
import { ExerciseBrowserComponent } from '../../shared/exercise-browser/exercise-browser.component';

@Component({
  selector: 'app-exercise-library',
  imports: [ExerciseBrowserComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head enter">
        <div class="titles">
          <span class="eyebrow">Biblioteca</span>
          <h1>Exercícios</h1>
        </div>
      </header>
      <app-exercise-browser class="enter enter-1" [muscle]="muscle()" (muscleChange)="onMuscle($event)" />
    </div>
  `,
})
export class ExerciseLibraryComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  /** Deep link: /exercicios?musculo=chest */
  readonly musculo = input<string>();
  protected readonly muscle = signal<MuscleSlug | null>(null);

  constructor() {
    effect(() => {
      const m = this.musculo();
      this.muscle.set(m && MUSCLE_ORDER.includes(m as MuscleSlug) ? (m as MuscleSlug) : null);
    });
  }

  onMuscle(m: MuscleSlug | null): void {
    if (m === this.muscle()) return;
    this.muscle.set(m);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { musculo: m ?? null }, replaceUrl: true });
  }
}
