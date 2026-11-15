import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Eye, EyeOff, LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { errorMessage } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head enter">
      <h1>Entrar</h1>
      <p class="muted">Bem-vindo de volta. Seu treino está te esperando.</p>
    </header>

    <form [formGroup]="form" (ngSubmit)="submit()" class="form enter enter-1" novalidate>
      <div class="field">
        <label for="email">E-mail</label>
        <input id="email" class="input" type="email" autocomplete="email" inputmode="email" formControlName="email"
               [class.invalid]="submitted() && form.controls.email.invalid" />
        @if (submitted() && form.controls.email.invalid) { <span class="error">Informe um e-mail válido.</span> }
      </div>

      <div class="field">
        <div class="label-row">
          <label for="password">Senha</label>
          <a routerLink="/recuperar-senha" class="link">Esqueci a senha</a>
        </div>
        <div class="pw">
          <input id="password" class="input" [type]="show() ? 'text' : 'password'" autocomplete="current-password" formControlName="password"
                 [class.invalid]="submitted() && form.controls.password.invalid" />
          <button type="button" class="icon-btn" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Ocultar senha' : 'Mostrar senha'">
            <lucide-icon [img]="show() ? icons.off : icons.eye" [size]="18" />
          </button>
        </div>
        @if (submitted() && form.controls.password.invalid) { <span class="error">Informe sua senha.</span> }
      </div>

      @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }

      <button class="btn primary lg block" type="submit" [disabled]="loading()">
        {{ loading() ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>

    <p class="alt enter enter-2">Ainda não tem conta? <a routerLink="/cadastro" class="link">Criar conta grátis</a></p>
  `,
  styleUrl: './auth-forms.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly voltar = input<string>();
  protected readonly icons = { eye: Eye, off: EyeOff };
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly show = signal(false);
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      const target = this.voltar();
      await this.router.navigateByUrl(target && target.startsWith('/') ? target : '/');
    } catch (err) {
      this.error.set(errorMessage(err, 'Não foi possível entrar.'));
    } finally {
      this.loading.set(false);
    }
  }
}
