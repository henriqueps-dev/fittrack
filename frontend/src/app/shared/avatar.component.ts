import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="'Foto de ' + name()" [style.width.px]="size()" [style.height.px]="size()" />
    } @else {
      <span class="initials" [style.width.px]="size()" [style.height.px]="size()" [style.font-size.px]="size() * 0.4">{{ initials() }}</span>
    }
  `,
  styles: `
    :host { display: inline-block; flex: none; }
    img, .initials { border-radius: 50%; display: grid; place-items: center; object-fit: cover; }
    .initials {
      background: var(--surface-3); color: var(--text); border: 1px solid var(--border-strong);
      font-family: var(--font-display); font-weight: 700; letter-spacing: 0.04em;
    }
  `,
})
export class AvatarComponent {
  readonly name = input('');
  readonly src = input<string | null | undefined>(null);
  readonly size = input(40);
  protected readonly initials = computed(() =>
    this.name().trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?');
}
