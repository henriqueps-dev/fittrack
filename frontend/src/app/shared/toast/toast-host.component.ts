import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CircleAlert, CircleCheck, Info, LucideAngularModule, X } from 'lucide-angular';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="host" aria-live="polite" aria-atomic="false">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="t.kind" role="status">
          <lucide-icon [img]="t.kind === 'success' ? icons.ok : t.kind === 'error' ? icons.err : icons.info" [size]="18" />
          <span>{{ t.message }}</span>
          <button class="close" type="button" (click)="toast.dismiss(t.id)" aria-label="Fechar aviso">
            <lucide-icon [img]="icons.x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .host {
      position: fixed; z-index: 90; left: 50%; transform: translateX(-50%);
      bottom: calc(var(--nav-h) + 16px + var(--safe-b));
      display: flex; flex-direction: column; gap: 8px; width: min(440px, calc(100% - 32px));
      pointer-events: none;
    }
    @media (min-width: 1024px) { .host { bottom: 24px; left: auto; right: 24px; transform: none; } }
    .toast {
      pointer-events: auto;
      display: flex; align-items: center; gap: 10px;
      padding: 12px 8px 12px 14px;
      background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--r-sm);
      box-shadow: 0 12px 32px rgba(0,0,0,.5);
      font-size: 0.92rem;
      animation: toast-in 260ms var(--ease-out) both;
    }
    .toast span { flex: 1; }
    .toast.success lucide-icon:first-child { color: var(--success); }
    .toast.error { border-color: var(--red-line); }
    .toast.error lucide-icon:first-child { color: var(--red-text); }
    .toast.info lucide-icon:first-child { color: var(--text-2); }
    .close { width: 32px; height: 32px; display: grid; place-items: center; border: 0; background: none; color: var(--text-3); border-radius: 8px; }
    .close:hover { color: var(--text); background: var(--surface-3); }
    @keyframes toast-in { from { opacity: 0; transform: translateY(8px) scale(.98); } }
  `,
})
export class ToastHostComponent {
  protected readonly toast = inject(ToastService);
  protected readonly icons = { ok: CircleCheck, err: CircleAlert, info: Info, x: X };
}
