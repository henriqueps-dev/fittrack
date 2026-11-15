import { ACESFilmicToneMapping, PCFSoftShadowMap, PerspectiveCamera, SRGBColorSpace, Scene, Vector2, WebGLRenderer } from 'three';

/** Uma cena registrada no palco: desenha em seu proprio canvas 2D. */
export interface StageView {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  wantsFrame(now: number): boolean;
  beforeRender(now: number): void;
}

/**
 * Palco unico com UM WebGLRenderer compartilhado. Navegadores limitam ~16 contextos WebGL por pagina,
 * entao cada miniatura renderiza neste renderer e copia o quadro para o seu canvas 2D.
 * O laco so roda enquanto ha cenas registradas e so desenha as que pedem quadro.
 */
class ThreeStage {
  private renderer: WebGLRenderer | null = null;
  private failed = false;
  private readonly views = new Set<StageView>();
  private raf = 0;
  private readonly size = new Vector2();

  get available(): boolean {
    return this.ensure() !== null;
  }

  register(v: StageView): void {
    this.views.add(v);
    this.kick();
  }

  unregister(v: StageView): void {
    this.views.delete(v);
  }

  private ensure(): WebGLRenderer | null {
    if (this.renderer || this.failed) return this.renderer;
    try {
      const r = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
      r.setPixelRatio(1);
      r.setClearColor(0x000000, 0);
      r.outputColorSpace = SRGBColorSpace;
      r.toneMapping = ACESFilmicToneMapping;
      r.toneMappingExposure = 1.05;
      r.shadowMap.enabled = true;
      r.shadowMap.type = PCFSoftShadowMap;
      this.renderer = r;
    } catch {
      this.failed = true;
    }
    return this.renderer;
  }

  private kick(): void {
    if (!this.raf && this.views.size) this.raf = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number): void => {
    this.raf = 0;
    if (!this.views.size) return;
    const r = this.ensure();
    if (!r) return;
    for (const v of this.views) {
      if (!v.wantsFrame(now)) continue;
      const w = v.canvas.width;
      const h = v.canvas.height;
      if (!w || !h) continue;
      v.beforeRender(now);
      r.getSize(this.size);
      if (this.size.x !== w || this.size.y !== h) r.setSize(w, h, false);
      r.render(v.scene, v.camera);
      v.ctx.clearRect(0, 0, w, h);
      v.ctx.drawImage(r.domElement, 0, 0);
    }
    this.kick();
  };
}

export const threeStage = new ThreeStage();
