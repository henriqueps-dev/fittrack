import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Logotipo FITTRACK: marca grafica (anilha estilizada) + wordmark condensado. */
@Component({
  selector: 'app-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--red)" />
      <path d="M9 22.5V9.5h9.5M9 15.5h7" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M19.5 15.5h4M21.5 15.5V23" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" />
    </svg>
    @if (wordmark()) {
      <span class="word">FIT<span>TRACK</span></span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 10px; }
    .word { font-family: var(--font-display); font-weight: 700; font-size: 1.35rem; letter-spacing: 0.06em; line-height: 1; }
    .word span { color: var(--red-text); }
  `,
})
export class BrandMarkComponent {
  readonly size = input(30);
  readonly wordmark = input(true);
}
