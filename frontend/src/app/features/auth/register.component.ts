import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Eye, EyeOff, LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { errorMessage } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head enter">
      <h1>Criar conta</h1>
      <p class="muted">Leva menos de um minuto. Depois é só montar o primeiro treino.</p>
    </header>

    <form [formGroup]="form" (ngSubmit)="submit()" class="form enter enter-1" novalidate>
      <div class="field">
        <label for="name">Nome</label>
        <input id="name" class="input" autocomplete="name" formControlName="name" [class.invalid]="submitted() && form.controls.name.invalid" />
        @if (submitted() && form.controls.name.invalid) { <span class="error">Informe seu nome.</span> }
      </div>
      <div class="field">
        <label for="email">E-mail</label>
        <input id="email" class="input" type="email" autocomplete="email" inputmode="email" formControlName="email"
               [class.invalid]="submitted() && form.controls.email.invalid" />
        @if (submitted() && form.controls.email.invalid) { <span class="error">Informe um e-mail válido.</span> }
      </div>
      <div class="field">
        <label for="password">Senha</label>
        <div class="pw">
          <input id="password" class="input" [type]="show() ? 'text' : 'password'" autocomplete="new-password" formControlName="password"
                 [class.invalid]="submitted() && form.controls.password.invalid" />
          <button type="button" class="icon-btn" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Ocultar senha' : 'Mostrar senha'">
            <lucide-icon [img]="show() ? icons.off : icons.eye" [size]="18" />
          </button>
        </div>
        @if (submitted() && form.controls.password.invalid) {
          <span class="error">Use pelo menos 8 caracteres.</span>
        } @else {
          <span class="hint">Mínimo de 8 caracteres.</span>
        }
      </div>

      @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }

      <button class="btn primary lg block" type="submit" [disabled]="loading()">
        {{ loading() ? 'Criando conta…' : 'Criar conta' }}
      </button>
    </form>

    <p class="alt enter enter-2">Já tem conta? <a routerLink="/entrar" class="link">Entrar</a></p>
  `,
  styleUrl: './auth-forms.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly icons = { eye: Eye, off: EyeOff };
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
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
      const { name, email, password } = this.form.getRawValue();
      await this.auth.register(name, email, password);
      await this.router.navigateByUrl('/');
    } catch (err) {
      this.error.set(errorMessage(err, 'Não foi possível criar a conta.'));
    } finally {
      this.loading.set(false);
    }
  }
}
