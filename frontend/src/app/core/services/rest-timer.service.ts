import { Injectable, computed, signal } from '@angular/core';

/**
 * Cronometro de descanso baseado em horario absoluto (continua correto se a aba for suspensa).
 * Ao terminar: vibracao, sinal sonoro e notificacao do sistema (se permitida).
 */
@Injectable({ providedIn: 'root' })
export class RestTimerService {
  private readonly endsAt = signal<number | null>(null);
  private readonly total = signal(0);
  private readonly now = signal(Date.now());
  private handle: ReturnType<typeof setInterval> | null = null;
  private audio: AudioContext | null = null;
  private notified = false;

  readonly running = computed(() => this.endsAt() !== null);
  readonly remaining = computed(() => {
    const end = this.endsAt();
    return end === null ? 0 : Math.max(0, Math.ceil((end - this.now()) / 1000));
  });
  readonly progress = computed(() => (this.total() > 0 ? 1 - this.remaining() / this.total() : 0));
  readonly totalSeconds = this.total.asReadonly();

  readonly notificationsEnabled = signal(typeof Notification !== 'undefined' && Notification.permission === 'granted');

  start(seconds: number): void {
    if (seconds <= 0) return;
    this.unlockAudio();
    this.total.set(seconds);
    this.endsAt.set(Date.now() + seconds * 1000);
    this.now.set(Date.now());
    this.notified = false;
    this.tick();
  }

  add(seconds: number): void {
    const end = this.endsAt();
    if (end === null) return;
    const next = Math.max(Date.now() + 1000, end + seconds * 1000);
    this.endsAt.set(next);
    this.total.update((t) => Math.max(1, t + seconds));
  }

  stop(): void {
    this.endsAt.set(null);
    if (this.handle) {
      clearInterval(this.handle);
      this.handle = null;
    }
  }

  async enableNotifications(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false;
    const result = await Notification.requestPermission();
    this.notificationsEnabled.set(result === 'granted');
    return result === 'granted';
  }

  private tick(): void {
    if (this.handle) clearInterval(this.handle);
    this.handle = setInterval(() => {
      this.now.set(Date.now());
      if (this.remaining() === 0 && !this.notified) {
        this.notified = true;
        this.alert();
        setTimeout(() => this.stop(), 1200);
      }
    }, 250);
  }

  private alert(): void {
    navigator.vibrate?.([220, 90, 220]);
    this.beep();
    if (this.notificationsEnabled() && document.visibilityState !== 'visible') {
      const title = 'Descanso finalizado';
      const options: NotificationOptions = { body: 'Hora da próxima série. Bora!', icon: 'icons/icon-192x192.png', tag: 'rest-timer' };
      navigator.serviceWorker?.getRegistration()
        .then((reg) => {
          if (reg) return reg.showNotification(title, options);
          new Notification(title, options);
          return undefined;
        })
        .catch(() => undefined);
    }
  }

  /** Navegadores exigem gesto do usuario para liberar audio: chamado ao iniciar o cronometro. */
  private unlockAudio(): void {
    try {
      this.audio ??= new AudioContext();
      if (this.audio.state === 'suspended') void this.audio.resume();
    } catch {
      this.audio = null;
    }
  }

  private beep(): void {
    if (!this.audio) return;
    const ctx = this.audio;
    [0, 0.22].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.2);
    });
  }
}
