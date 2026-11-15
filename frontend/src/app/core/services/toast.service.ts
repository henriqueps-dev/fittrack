import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast { id: number; kind: ToastKind; message: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, kind: ToastKind = 'info', ms = 3600): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list.slice(-2), { id, kind, message }]);
    setTimeout(() => this.dismiss(id), ms);
  }

  success(message: string): void { this.show(message, 'success'); }

  error(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): void {
    this.show(errorMessage(err, fallback), 'error', 5000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}

/** Extrai a mensagem amigavel do ProblemDetail retornado pela API. */
export function errorMessage(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Sem conexão com o servidor.';
    const detail = (err.error && typeof err.error === 'object' && 'detail' in err.error) ? String(err.error.detail) : null;
    return detail || fallback;
  }
  return fallback;
}

export function isNetworkError(err: unknown): boolean {
  return err instanceof HttpErrorResponse && (err.status === 0 || err.status === 504);
}
