import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { errorMessage } from '../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head enter">
      <h1>Recuperar senha</h1>
      <p class="muted">Informe o e-mail da sua conta para receber o link de redefinição.</p>
    </header>

    @if (sent(); as res) {
      <div class="notice enter" role="status">
        <p>{{ res.message }}</p>
        @if (res.resetToken) {
          <p class="faint">Ambiente de desenvolvimento: sem servidor de e-mail configurado, o link também é exibido aqui.</p>
          <a class="btn primary block" [routerLink]="'/redefinir-senha'" [queryParams]="{ token: res.resetToken }">Definir nova senha</a>
        }
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="form enter enter-1" novalidate>
        <div class="field">
          <label for="email">E-mail</label>
          <input id="email" class="input" type="email" autocomplete="email" inputmode="email" formControlName="email"
                 [class.invalid]="submitted() && form.controls.email.invalid" />
          @if (submitted() && form.controls.email.invalid) { <span class="error">Informe um e-mail válido.</span> }
        </div>
        @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
        <button class="btn primary lg block" type="submit" [disabled]="loading()">{{ loading() ? 'Enviando…' : 'Enviar link' }}</button>
      </form>
    }

    <p class="alt enter enter-2"><a routerLink="/entrar" class="link">Voltar para o login</a></p>
  `,
  styleUrl: './auth-forms.scss',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  protected readonly form = inject(FormBuilder).nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sent = signal<{ message: string; resetToken?: string } | null>(null);

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      this.sent.set(await this.auth.forgotPassword(this.form.getRawValue().email));
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
