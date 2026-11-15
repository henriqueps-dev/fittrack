import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService, errorMessage } from '../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head enter">
      <h1>Nova senha</h1>
      <p class="muted">Escolha uma senha nova para a sua conta.</p>
    </header>
    @if (!token()) {
      <div class="notice"><p>Link inválido. Solicite a recuperação de senha novamente.</p>
        <a routerLink="/recuperar-senha" class="btn ghost block">Recuperar senha</a></div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="form enter enter-1" novalidate>
        <div class="field">
          <label for="password">Nova senha</label>
          <input id="password" class="input" type="password" autocomplete="new-password" formControlName="password"
                 [class.invalid]="submitted() && form.controls.password.invalid" />
          <span [class]="submitted() && form.controls.password.invalid ? 'error' : 'hint'">Mínimo de 8 caracteres.</span>
        </div>
        @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
        <button class="btn primary lg block" type="submit" [disabled]="loading()">{{ loading() ? 'Salvando…' : 'Salvar nova senha' }}</button>
      </form>
    }
  `,
  styleUrl: './auth-forms.scss',
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly token = input<string>();
  protected readonly form = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid || !this.token()) return;
    this.loading.set(true);
    try {
      await this.auth.resetPassword(this.token()!, this.form.getRawValue().password);
      this.toast.success('Senha alterada. Entre com a nova senha.');
      await this.router.navigateByUrl('/entrar');
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
