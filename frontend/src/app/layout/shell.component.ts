import { InstallBannerComponent } from '../shared/install-banner.component';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ChartLine, ChevronRight, CloudOff, Dumbbell, History, House, ListChecks, LucideAngularModule, Plus, User } from 'lucide-angular';
import { AuthService } from '../core/services/auth.service';
import { NetworkService } from '../core/services/network.service';
import { SessionStore } from '../core/services/session.store';
import { BrandMarkComponent } from '../shared/brand-mark.component';
import { AvatarComponent } from '../shared/avatar.component';

interface NavItem { path: string; label: string; icon: typeof House; exact?: boolean; }

@Component({
  selector: 'app-shell',
  imports: [InstallBannerComponent, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, BrandMarkComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar" aria-label="Navegação principal">
      <a routerLink="/" class="brand"><app-brand-mark /></a>
      <a routerLink="/treinos/novo" class="btn primary block new">
        <lucide-icon [img]="icons.plus" [size]="18" /> Montar treino
      </a>
      <nav>
        @for (item of nav; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: !!item.exact }" class="side-link">
            <lucide-icon [img]="item.icon" [size]="20" />
            <span>{{ item.label }}</span>
          </a>
        }
        <a routerLink="/historico" routerLinkActive="on" class="side-link">
          <lucide-icon [img]="icons.history" [size]="20" />
          <span>Histórico</span>
        </a>
      </nav>
      <a routerLink="/perfil" class="me">
        <app-avatar [name]="auth.user()?.name ?? ''" [src]="auth.user()?.avatar" [size]="36" />
        <span class="grow">
          <span class="name">{{ auth.user()?.name }}</span>
          <span class="mail">{{ auth.user()?.email }}</span>
        </span>
      </a>
    </aside>

    <div class="main">
      @if (!network.online()) {
        <div class="banner" role="status">
          <lucide-icon [img]="icons.offline" [size]="16" />
          Você está offline. Treinos e registros ficam salvos no aparelho.
        </div>
      }
      <app-install-banner />
      <router-outlet />
    </div>

    @if (store.active(); as s) {
      <a routerLink="/treino-ativo" class="resume" aria-label="Voltar ao treino em andamento">
        <span class="pulse" aria-hidden="true"></span>
        <span class="grow">
          <span class="eyebrow">Treino em andamento</span>
          <span class="t">{{ s.workoutName }}</span>
        </span>
        <span class="num pct">{{ progressPct() }}%</span>
        <lucide-icon [img]="icons.chevron" [size]="18" />
      </a>
    }

    <nav class="bottom" aria-label="Navegação principal">
      @for (item of nav; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: !!item.exact }" class="tab">
          <lucide-icon [img]="item.icon" [size]="22" />
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .main { min-width: 0; }

    .sidebar { display: none; }

    .bottom {
      position: fixed; z-index: 40; left: 0; right: 0; bottom: 0;
      height: calc(var(--nav-h) + var(--safe-b));
      padding: 0 4px var(--safe-b);
      display: grid; grid-template-columns: repeat(5, 1fr);
      background: rgba(6, 6, 6, 0.86);
      backdrop-filter: blur(16px) saturate(140%);
      -webkit-backdrop-filter: blur(16px) saturate(140%);
      border-top: 1px solid var(--border);
    }
    .tab {
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
      color: var(--text-3); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.02em;
      transition: color 160ms var(--ease-out);
      -webkit-user-select: none; user-select: none;
    }
    .tab::before {
      content: ''; position: absolute; top: 0; left: 50%; width: 28px; height: 2px; border-radius: 2px;
      background: var(--red); transform: translateX(-50%) scaleX(0); transition: transform 240ms var(--ease-out);
    }
    .tab.on { color: var(--text); }
    .tab.on::before { transform: translateX(-50%) scaleX(1); }
    .tab.on lucide-icon { color: var(--red-text); }
    .tab:active lucide-icon { transform: scale(0.9); }
    .tab lucide-icon { transition: transform 120ms var(--ease-out); }

    .banner {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: calc(8px + var(--safe-t)) 16px 8px;
      background: var(--surface-2); border-bottom: 1px solid var(--border);
      font-size: 0.85rem; color: var(--text-2); text-align: center;
    }
    .banner lucide-icon { color: var(--warning); flex: none; }

    .resume {
      position: fixed; z-index: 39; left: 12px; right: 12px;
      bottom: calc(var(--nav-h) + 10px + var(--safe-b));
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px;
      background: var(--surface-2); border: 1px solid var(--red-line); border-radius: var(--r);
      box-shadow: 0 16px 40px rgba(0,0,0,.55);
      animation: rise 360ms var(--ease-out) both;
    }
    .resume .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .resume .eyebrow { color: var(--red-text); font-size: 0.7rem; }
    .resume .t { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .resume .pct { font-size: 1.2rem; }
    .pulse { width: 10px; height: 10px; border-radius: 50%; background: var(--red); box-shadow: 0 0 0 0 var(--red-line); animation: ping 1.8s var(--ease-out) infinite; flex: none; }
    @keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(225,29,46,.55); } 80%, 100% { box-shadow: 0 0 0 10px rgba(225,29,46,0); } }
    @keyframes rise { from { opacity: 0; transform: translateY(12px); } }

    @media (min-width: 1024px) {
      :host { display: grid; grid-template-columns: var(--sidebar-w) 1fr; }
      .bottom { display: none; }
      .sidebar {
        display: flex; flex-direction: column; gap: 20px;
        position: sticky; top: 0; height: 100dvh;
        padding: 24px 16px;
        border-right: 1px solid var(--border);
        background: var(--bg-elev);
      }
      .brand { padding: 4px 8px 8px; }
      nav { display: flex; flex-direction: column; gap: 2px; }
      .side-link {
        display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 12px; border-radius: var(--r-sm);
        color: var(--text-2); font-weight: 500;
        transition: background-color 160ms var(--ease-out), color 160ms;
      }
      .side-link:hover { background: var(--surface); color: var(--text); }
      .side-link.on { background: var(--surface-2); color: var(--text); box-shadow: inset 2px 0 0 var(--red); }
      .side-link.on lucide-icon { color: var(--red-text); }
      .me {
        margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: var(--r-sm);
        border: 1px solid var(--border);
      }
      .me:hover { background: var(--surface); }
      .me .grow { min-width: 0; display: flex; flex-direction: column; }
      .me .name { font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .me .mail { font-size: 0.75rem; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .resume { left: auto; right: 24px; bottom: 24px; width: 360px; }
    }
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly network = inject(NetworkService);
  protected readonly store = inject(SessionStore);
  protected readonly icons = { plus: Plus, history: History, offline: CloudOff, chevron: ChevronRight };
  protected readonly progressPct = computed(() => Math.round(this.store.progress().ratio * 100));

  protected readonly nav: NavItem[] = [
    { path: '/', label: 'Início', icon: House, exact: true },
    { path: '/treinos', label: 'Treinos', icon: ListChecks },
    { path: '/exercicios', label: 'Exercícios', icon: Dumbbell },
    { path: '/evolucao', label: 'Evolução', icon: ChartLine },
    { path: '/perfil', label: 'Perfil', icon: User },
  ];

  constructor() {
    void this.store.restore();
  }
}
