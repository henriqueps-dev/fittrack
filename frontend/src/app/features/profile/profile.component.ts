import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Bell, Camera, Download, KeyRound, LogOut, LucideAngularModule, Trash2 } from 'lucide-angular';
import { Difficulty, TrainingGoal, User } from '../../core/models/api.models';
import { UserApi } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { PwaService } from '../../core/services/pwa.service';
import { RestTimerService } from '../../core/services/rest-timer.service';
import { ToastService } from '../../core/services/toast.service';
import { DIFFICULTY_LABEL, GOAL_LABEL } from '../../core/utils/format';
import { AvatarComponent } from '../../shared/avatar.component';

interface ProfileForm {
  name: string; birthDate: string; heightCm: number | null; weightKg: number | null;
  goal: TrainingGoal | ''; experienceLevel: Difficulty; weeklyGoal: number; defaultRestSeconds: number;
}

/** Perfil: foto, dados pessoais, preferencias de treino, senha, notificacoes e instalacao do app. */
@Component({
  selector: 'app-profile',
  imports: [FormsModule, LucideAngularModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly api = inject(UserApi);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly pwa = inject(PwaService);
  protected readonly timer = inject(RestTimerService);

  protected readonly icons = { camera: Camera, trash: Trash2, key: KeyRound, logout: LogOut, bell: Bell, download: Download };
  protected readonly goals = Object.entries(GOAL_LABEL) as [TrainingGoal, string][];
  protected readonly levels = Object.entries(DIFFICULTY_LABEL) as [Difficulty, string][];
  protected readonly rests = [30, 45, 60, 75, 90, 120, 150, 180];

  protected readonly user = this.auth.user;
  protected readonly form = signal<ProfileForm>(this.toForm(this.auth.user()));
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly pwdOpen = signal(false);
  protected readonly pwd = signal({ current: '', next: '', confirm: '' });
  protected readonly pwdError = signal('');
  protected readonly confirmLogout = signal(false);

  protected readonly memberSince = computed(() => {
    const u = this.user();
    return u ? new Date(u.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';
  });
  protected readonly dirty = computed(() => JSON.stringify(this.form()) !== JSON.stringify(this.toForm(this.user())));
  protected readonly bmi = computed(() => {
    const f = this.form();
    if (!f.heightCm || !f.weightKg) return null;
    return Number(f.weightKg) / (Number(f.heightCm) / 100) ** 2;
  });

  constructor() {
    this.api.me().then((u) => {
      this.auth.setUser(u);
      if (!this.dirty()) this.form.set(this.toForm(u));
    }).catch(() => undefined);
  }

  private toForm(u: User | null): ProfileForm {
    return {
      name: u?.name ?? '', birthDate: u?.birthDate ?? '', heightCm: u?.heightCm ?? null, weightKg: u?.weightKg ?? null,
      goal: u?.goal ?? '', experienceLevel: u?.experienceLevel ?? 'BEGINNER', weeklyGoal: u?.weeklyGoal ?? 3,
      defaultRestSeconds: u?.defaultRestSeconds ?? 90,
    };
  }

  set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
    if (this.errors()[key]) this.errors.update((e) => ({ ...e, [key]: '' }));
  }

  num(raw: string): number | null {
    if (raw === '' || raw == null) return null;
    const n = Number(String(raw).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  reset(): void {
    this.form.set(this.toForm(this.user()));
    this.errors.set({});
  }

  private validate(f: ProfileForm): Record<string, string> {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e['name'] = 'Informe seu nome.';
    if (f.heightCm != null && (f.heightCm < 100 || f.heightCm > 250)) e['heightCm'] = 'Entre 100 e 250 cm.';
    if (f.weightKg != null && (f.weightKg < 25 || f.weightKg > 400)) e['weightKg'] = 'Entre 25 e 400 kg.';
    if (f.birthDate && new Date(f.birthDate) >= new Date()) e['birthDate'] = 'Data inválida.';
    return e;
  }

  async save(): Promise<void> {
    const f = this.form();
    const errs = this.validate(f);
    this.errors.set(errs);
    if (Object.values(errs).some(Boolean)) return;
    this.saving.set(true);
    try {
      const u = await this.api.update({
        name: f.name.trim(), birthDate: f.birthDate || undefined, heightCm: f.heightCm ?? undefined, weightKg: f.weightKg ?? undefined,
        goal: f.goal || undefined, experienceLevel: f.experienceLevel, weeklyGoal: f.weeklyGoal, defaultRestSeconds: f.defaultRestSeconds,
      });
      this.auth.setUser(u);
      this.form.set(this.toForm(u));
      this.toast.success('Perfil atualizado.');
    } catch (err) {
      this.toast.error(err, 'Não foi possível salvar o perfil.');
    } finally {
      this.saving.set(false);
    }
  }

  async onAvatar(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      this.toast.show('Use uma imagem PNG, JPG ou WebP.');
      return;
    }
    this.uploading.set(true);
    try {
      const dataUrl = await resizeImage(file, 320);
      this.auth.setUser(await this.api.avatar(dataUrl));
      this.toast.success('Foto atualizada.');
    } catch (err) {
      this.toast.error(err, 'Não foi possível enviar a foto.');
    } finally {
      this.uploading.set(false);
    }
  }

  async removeAvatar(): Promise<void> {
    try {
      this.auth.setUser(await this.api.removeAvatar());
    } catch (err) {
      this.toast.error(err, 'Não foi possível remover a foto.');
    }
  }

  setPwd(key: 'current' | 'next' | 'confirm', v: string): void {
    this.pwd.update((p) => ({ ...p, [key]: v }));
    this.pwdError.set('');
  }

  async changePassword(): Promise<void> {
    const p = this.pwd();
    if (!p.current || !p.next) { this.pwdError.set('Preencha a senha atual e a nova.'); return; }
    if (p.next.length < 8) { this.pwdError.set('A nova senha precisa de pelo menos 8 caracteres.'); return; }
    if (p.next !== p.confirm) { this.pwdError.set('A confirmação não confere.'); return; }
    this.saving.set(true);
    try {
      await this.api.changePassword(p.current, p.next);
      this.toast.success('Senha alterada.');
      this.pwdOpen.set(false);
      this.pwd.set({ current: '', next: '', confirm: '' });
    } catch (err) {
      this.toast.error(err, 'Não foi possível alterar a senha.');
    } finally {
      this.saving.set(false);
    }
  }

  async notifications(): Promise<void> {
    const ok = await this.timer.enableNotifications();
    this.toast.show(ok ? 'Notificações ativadas.' : 'O navegador bloqueou as notificações. Libere nas configurações do site.');
  }

  async install(): Promise<void> {
    await this.pwa.install();
  }
}

/** Reduz a imagem (lado maior = max) e devolve data URL JPEG/WebP leve. */
function resizeImage(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = Math.min(max, side);
      const ctx = canvas.getContext('2d')!;
      // recorte central quadrado
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });
}
