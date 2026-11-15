import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, ForgotPasswordResponse, User } from '../models/api.models';
import { storage } from '../utils/storage';

const TOKEN_KEY = 'ft.token';
const USER_KEY = 'ft.user';

interface StoredToken { token: string; expiresAt: number; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = `${environment.apiUrl}/auth`;

  private readonly _token = signal<StoredToken | null>(this.loadToken());
  private readonly _user = signal<User | null>(storage.get<User | null>(USER_KEY, null));

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => {
    const t = this._token();
    return !!t && t.expiresAt > Date.now();
  });

  get token(): string | null {
    return this.isAuthenticated() ? this._token()!.token : null;
  }

  async login(email: string, password: string): Promise<void> {
    this.store(await firstValueFrom(this.http.post<AuthResponse>(`${this.api}/login`, { email, password })));
  }

  async register(name: string, email: string, password: string): Promise<void> {
    this.store(await firstValueFrom(this.http.post<AuthResponse>(`${this.api}/register`, { name, email, password })));
  }

  forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return firstValueFrom(this.http.post<ForgotPasswordResponse>(`${this.api}/forgot-password`, { email }));
  }

  resetPassword(token: string, newPassword: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.api}/reset-password`, { token, newPassword }));
  }

  setUser(user: User): void {
    this._user.set(user);
    storage.set(USER_KEY, user);
  }

  logout(redirect = true): void {
    this._token.set(null);
    this._user.set(null);
    storage.remove(TOKEN_KEY);
    storage.remove(USER_KEY);
    // Dados locais de outro usuario nao devem persistir apos o logout.
    ['ft.activeSession', 'ft.pendingSessions', 'ft.workouts', 'ft.exercises'].forEach((k) => storage.remove(k));
    if (redirect) {
      this.router.navigateByUrl('/entrar');
    }
  }

  private store(res: AuthResponse): void {
    const t: StoredToken = { token: res.token, expiresAt: Date.now() + res.expiresIn * 1000 };
    this._token.set(t);
    storage.set(TOKEN_KEY, t);
    this.setUser(res.user);
  }

  private loadToken(): StoredToken | null {
    const t = storage.get<StoredToken | null>(TOKEN_KEY, null);
    return t && t.expiresAt > Date.now() ? t : null;
  }
}
