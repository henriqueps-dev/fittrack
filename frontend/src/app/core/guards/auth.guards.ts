import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/entrar'], { queryParams: state.url !== '/' ? { voltar: state.url } : {} });
};

/** Rotas de visitante (login/cadastro): ignoradas quando ja existe sessao, caindo no app. */
export const guestGuard: CanMatchFn = () => !inject(AuthService).isAuthenticated();
