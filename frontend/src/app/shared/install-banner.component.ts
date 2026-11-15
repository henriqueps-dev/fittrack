import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Download, LucideAngularModule, Share, SquarePlus, X } from 'lucide-angular';
import { PwaService } from '../core/services/pwa.service';
import { storage } from '../core/utils/storage';

const DISMISS_KEY = 'ft.installDismissedAt';
const DISMISS_DAYS = 14;

/**
 * Convite para instalar o app no celular.
 * Android/Chrome: usa o prompt nativo. iPhone (Safari nao tem prompt): mostra o passo a passo.
 */
@Component({
  selector: 'app-install-banner',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <aside class="banner" role="region" aria-label="Instalar o app">
        <img src="icons/icon-96x96.png" alt="" width="44" height="44" />
        <div class="text">
          <strong>Instale o FITTRACK</strong>
          @if (pwa.isIos) {
            <span>Toque em <lucide-icon [img]="icons.share" [size]="14" /> <b>Compartilhar</b> e depois em
              <lucide-icon [img]="icons.add" [size]="14" /> <b>Adicionar à Tela de Início</b>.</span>
          } @else {
            <span>Abre em tela cheia, direto da tela inicial, e funciona offline na academia.</span>
          }
        </div>
        @if (!pwa.isIos) {
          <button type="button" class="btn primary sm" (click)="install()"><lucide-icon [img]="icons.download" [size]="16" /> Instalar</button>
        }
        <button type="button" class="icon-btn" (click)="dismiss()" aria-label="Agora não"><lucide-icon [img]="icons.x" [size]="18" /></button>
      </aside>
    }
  `,
  styles: `
    .banner {
      display: flex; align-items: center; gap: 12px; margin: 12px 16px 0; padding: 12px 8px 12px 12px;
      background: linear-gradient(100deg, rgba(225, 29, 46, 0.16), var(--surface) 60%);
      border: 1px solid var(--red-line); border-radius: var(--r);
      animation: enter 360ms var(--ease-out) both;
    }
    @media (min-width: 1024px) { .banner { max-width: 1040px; margin: 24px auto 0; } }
    img { flex: none; border-radius: 12px; }
    .text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; font-size: 0.85rem; color: var(--text-2); }
    .text strong { color: var(--text); font-size: 0.95rem; }
    .text lucide-icon { display: inline-block; vertical-align: -2px; color: var(--red-text); }
    .text b { color: var(--text); font-weight: 600; }
  `,
})
export class InstallBannerComponent {
  protected readonly pwa = inject(PwaService);
  protected readonly icons = { download: Download, share: Share, add: SquarePlus, x: X };
  private readonly dismissed = signal(isRecentlyDismissed());

  protected readonly visible = computed(() =>
    !this.dismissed() && !this.pwa.installed() && (this.pwa.canInstall() || (this.pwa.isIos && isSafari())));

  async install(): Promise<void> {
    const ok = await this.pwa.install();
    if (!ok) this.dismiss();
  }

  dismiss(): void {
    storage.set(DISMISS_KEY, Date.now());
    this.dismissed.set(true);
  }
}

function isRecentlyDismissed(): boolean {
  const at = storage.get<number | null>(DISMISS_KEY, null);
  return at != null && Date.now() - at < DISMISS_DAYS * 86_400_000;
}

function isSafari(): boolean {
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}
