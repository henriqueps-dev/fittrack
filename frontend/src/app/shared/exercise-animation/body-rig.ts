import {
  AdditiveBlending, Bone, Box3, BufferGeometry, CanvasTexture, CircleGeometry, Color, CylinderGeometry, DirectionalLight,
  Group, HemisphereLight, Material, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera,
  PlaneGeometry, Quaternion, SRGBColorSpace, Scene, ShadowMaterial, SkinnedMesh, SphereGeometry, TorusGeometry, Vector3, Vector4,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Equipment, MuscleSlug } from '../../core/models/api.models';
import { HumanAsset, MUSCLE_SLOTS } from './human-model';
import { FRONT_HIP, FRONT_SHOULDER, Figure, L, Pt, dir, poseAt, rad, solve } from './kinematics';
import { MOVEMENTS, MOVEMENT_FALLBACK, Movement, Prop } from './movements';

/* ================================================================== recursos compartilhados */

interface Shared {
  box: BufferGeometry; ball: BufferGeometry; cyl: BufferGeometry; disc: BufferGeometry; torus: BufferGeometry; plane: BufferGeometry;
  steel: Material; chrome: Material; rubber: Material; frame: Material; pad: Material; prop: Material;
  floor: Material; glow: Material; contact: Material; cable: Material;
}

let shared: Shared | null = null;

function radialTexture(inner: string): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function res(): Shared {
  if (shared) return shared;
  const css = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => new Color(css.getPropertyValue(name).trim() || fallback);
  const std = (color: Color | string, roughness: number, metalness: number) => new MeshStandardMaterial({ color, roughness, metalness });
  shared = {
    box: new RoundedBoxGeometry(1, 1, 1, 3, 0.18),
    ball: new SphereGeometry(1, 24, 16),
    cyl: new CylinderGeometry(1, 1, 1, 24),
    disc: new CylinderGeometry(1, 1, 1, 40),
    torus: new TorusGeometry(1, 0.26, 10, 28),
    plane: new PlaneGeometry(1, 1),
    steel: std(token('--steel', '#9ca3af'), 0.3, 0.9),
    chrome: std('#d9dbe0', 0.18, 1),
    rubber: std('#141416', 0.7, 0.05),
    frame: std('#d4d5da', 0.45, 0.3),
    pad: std('#121214', 0.62, 0.05),
    prop: std(token('--surface-3', '#232327'), 0.78, 0.12),
    floor: new ShadowMaterial({ opacity: 0.5 }),
    glow: new MeshBasicMaterial({ map: radialTexture('rgba(225,29,46,0.28)'), transparent: true, blending: AdditiveBlending, depthWrite: false }),
    contact: new MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,0.8)'), transparent: true, depthWrite: false }),
    cable: new MeshBasicMaterial({ color: '#6b6b74' }),
  };
  return shared;
}

/** Pele com o musculo principal (vermelho) e secundarios (vermelho claro) pintados por peso de vertice. */
function skinMaterial(primary: MuscleSlug | null, secondary: MuscleSlug[]): MeshStandardMaterial {
  const mask = (list: MuscleSlug[]) => {
    // Vector4() nasce com w = 1: zera explicitamente
    const v = [new Vector4(0, 0, 0, 0), new Vector4(0, 0, 0, 0), new Vector4(0, 0, 0, 0)];
    for (const mu of list) {
      const k = MUSCLE_SLOTS.indexOf(mu);
      if (k >= 0) v[k >> 2].setComponent(k & 3, 1);
    }
    return v;
  };
  const p = mask(primary ? [primary] : []);
  const s = mask(secondary.filter((x) => x !== primary));
  const mat = new MeshStandardMaterial({ color: '#c4c5ca', roughness: 0.46, metalness: 0.02 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, {
      uP0: { value: p[0] }, uP1: { value: p[1] }, uP2: { value: p[2] },
      uS0: { value: s[0] }, uS1: { value: s[1] }, uS2: { value: s[2] },
      uDeep: { value: new Color('#b3121f') }, uRed: { value: new Color('#e3343f') }, uEdge: { value: new Color('#f08a8a') },
      uSoft: { value: new Color('#f2a48f') },
    });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 m0;\nattribute vec4 m1;\nattribute vec4 m2;\nvarying vec4 vM0;\nvarying vec4 vM1;\nvarying vec4 vM2;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvM0 = m0; vM1 = m1; vM2 = m2;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec4 uP0, uP1, uP2, uS0, uS1, uS2;\nuniform vec3 uDeep, uRed, uEdge, uSoft;\nvarying vec4 vM0, vM1, vM2;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float mPri = clamp(dot(vM0, uP0) + dot(vM1, uP1) + dot(vM2, uP2), 0.0, 1.0);
        float mSec = clamp(dot(vM0, uS0) + dot(vM1, uS1) + dot(vM2, uS2), 0.0, 1.0);
        // degrade: borda rosada que se funde na pele -> vermelho -> miolo vermelho profundo
        vec3 grad = mix(uEdge, uRed, smoothstep(0.15, 0.6, mPri));
        grad = mix(grad, uDeep, smoothstep(0.6, 1.0, mPri) * 0.75);
        float aPri = smoothstep(0.02, 0.7, mPri);
        float aSec = smoothstep(0.05, 0.85, mSec) * 0.6 * (1.0 - aPri);
        diffuseColor.rgb = mix(mix(diffuseColor.rgb, uSoft, aSec), grad, aPri * 0.92);`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uRed * smoothstep(0.3, 1.0, mPri) * 0.12;');
  };
  return mat;
}

/* ================================================================== geometria */

const FLOOR = 181;
const UP = new Vector3(0, 1, 0);
const tmp = new Vector3();
const V = (p: Pt, z = 0) => new Vector3(p[0], FLOOR - p[1], z);

function place(m: Mesh, a: Vector3, b: Vector3, sx: number, sz: number, t0 = 0, t1 = 1): void {
  tmp.subVectors(b, a);
  const len = Math.max(tmp.length(), 0.001);
  m.position.copy(a).addScaledVector(tmp, (t0 + t1) / 2);
  m.quaternion.setFromUnitVectors(UP, tmp.divideScalar(len));
  m.scale.set(sx, len * (t1 - t0), sz);
}

/** Quaternion de um referencial ortonormal (frente, eixo do osso). */
function frameQuat(front: Vector3, axis: Vector3): Quaternion {
  const y = axis.clone().normalize();
  const x = front.clone().addScaledVector(y, -front.dot(y));
  if (x.lengthSq() < 1e-8) x.set(0, 0, 1).addScaledVector(y, -y.z);
  x.normalize();
  const z = new Vector3().crossVectors(x, y);
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}

/* ================================================================== corpo humano */

export interface RigOptions { shadows: boolean; fit: boolean; orbit: boolean; }

interface Skeleton {
  hip: Vector3; shoulder: Vector3; neck: Vector3; headTop: Vector3; front: Vector3;
  arms: { s: Vector3; e: Vector3; w: Vector3; f: Vector3 }[];
  legs: { h: Vector3; k: Vector3; a: Vector3; t: Vector3 }[];
}

type Target = (k: Skeleton) => { axis: Vector3; front: Vector3 };

interface Driven { bone: Bone; bindQ: Quaternion; bindFrame: Quaternion; target: Target; }

const ARM_Z = 17;
const LEG_Z = 8;
const PLATE_R = 22;
const FINGER_CURL = 1.05;

/**
 * Modelo humano com esqueleto (CC0) animado pelas poses do movimento: cada osso e girado para que o seu
 * eixo e a sua "frente" coincidam com os do esqueleto-alvo, controlando a torcao (joelho para frente etc.).
 */
class Human {
  readonly root: Object3D;
  private readonly bones = new Map<string, Bone>();
  private readonly driven: Driven[] = [];
  private readonly q = new Quaternion();
  private readonly q2 = new Quaternion();

  constructor(asset: HumanAsset, material: Material, shadows: boolean, limbFront: (a: Vector3, b: Vector3) => Vector3) {
    this.root = cloneSkinned(asset.scene);
    this.root.traverse((o) => {
      if ((o as Bone).isBone) this.bones.set(o.name.replace(/\./g, ''), o as Bone);
      const sm = o as SkinnedMesh;
      if (sm.isSkinnedMesh) {
        sm.material = material;
        sm.castShadow = shadows;
        sm.frustumCulled = false;
      }
    });
    this.root.updateMatrixWorld(true);

    const B = (n: string) => this.bones.get(n.replace(/\./g, ''))!;
    const head = (n: string) => B(n).getWorldPosition(new Vector3());
    const hip = head('spine');
    const U0 = head('spine.004').sub(hip).normalize();
    const R0 = head('thigh.R').sub(head('thigh.L')).normalize();
    const F0 = new Vector3().crossVectors(U0, R0).normalize();

    // escala: pernas do modelo = pernas da cinematica
    const legLen = head('thigh.R').distanceTo(head('shin.R')) + head('shin.R').distanceTo(head('foot.R'));
    this.root.scale.setScalar((L.th + L.sh) / legLen);
    this.root.updateMatrixWorld(true);

    // maos fechadas segurando o implemento
    const curl = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), FINGER_CURL);
    for (const s of ['L', 'R']) for (const fname of ['f_index', 'f_middle', 'f_ring', 'f_pinky']) {
      for (const seg of ['01', '02', '03']) B(`${fname}.${seg}.${s}`)?.quaternion.multiply(curl);
    }
    this.root.updateMatrixWorld(true);

    const add = (bone: string, child: string, bindFront: Vector3, target: Target) => {
      const b = B(bone);
      const axis = head(child).sub(head(bone));
      this.driven.push({ bone: b, bindQ: b.getWorldQuaternion(new Quaternion()), bindFrame: frameQuat(bindFront, axis), target });
    };
    add('spine', 'spine.004', F0, (k) => ({ axis: k.shoulder.clone().sub(k.hip), front: k.front }));
    // arms[0]/legs[0] = lado direito do corpo (lado proximo da camera na vista lateral)
    const sides: ['R' | 'L', number][] = [['R', 0], ['L', 1]];
    for (const [s, i] of sides) {
      const seg = (a: Vector3, b: Vector3) => ({ axis: b.clone().sub(a), front: limbFront(a, b) });
      add(`upper_arm.${s}`, `forearm.${s}`, F0, (k) => seg(k.arms[i].s, k.arms[i].e));
      add(`forearm.${s}`, `hand.${s}`, F0, (k) => seg(k.arms[i].e, k.arms[i].w));
      add(`hand.${s}`, `f_middle.01.${s}`, F0, (k) => seg(k.arms[i].w, k.arms[i].f));
      add(`thigh.${s}`, `shin.${s}`, F0, (k) => seg(k.legs[i].h, k.legs[i].k));
      add(`shin.${s}`, `foot.${s}`, F0, (k) => seg(k.legs[i].k, k.legs[i].a));
      add(`foot.${s}`, `toe.${s}`, U0, (k) => ({ axis: k.legs[i].t.clone().sub(k.legs[i].a), front: UP }));
    }
  }

  /** Posa o modelo no esqueleto-alvo e devolve o esqueleto real do modelo (para os implementos). */
  pose(k: Skeleton, anchor: 'hip' | 'hand' | 'foot' | 'toe'): Skeleton {
    for (const d of this.driven) {
      const { axis, front } = d.target(k);
      // rotacao de mundo que leva o referencial de repouso ao referencial alvo
      const r = frameQuat(front, axis).multiply(this.q.copy(d.bindFrame).invert());
      const world = r.multiply(d.bindQ);
      d.bone.parent!.getWorldQuaternion(this.q2);
      d.bone.quaternion.copy(this.q2.invert().multiply(world));
      d.bone.updateMatrixWorld(true);
    }
    const B = (n: string) => this.bones.get(n.replace(/\./g, ''))!;
    const head = (n: string) => B(n).getWorldPosition(new Vector3());
    // ancora: quadril, mao, tornozelo ou ponta do pe do lado proximo
    const anchorBone = { hip: 'spine', hand: 'hand.R', foot: 'foot.R', toe: 'toe.R' }[anchor];
    const target = { hip: k.hip, hand: k.arms[0].w, foot: k.legs[0].a, toe: k.legs[0].t }[anchor];
    this.root.position.add(target.clone().sub(head(anchorBone)));
    this.root.updateMatrixWorld(true);

    const arm = (s: string) => {
      const w = head(`hand.${s}`);
      return { s: head(`upper_arm.${s}`), e: head(`forearm.${s}`), w, f: w.clone().lerp(head(`f_middle.01.${s}`), 0.9) };
    };
    const leg = (s: string) => ({ h: head(`thigh.${s}`), k: head(`shin.${s}`), a: head(`foot.${s}`), t: head(`toe.${s}`) });
    const neck = head('spine.004');
    return {
      hip: head('spine'), shoulder: head('spine.003'), neck,
      headTop: neck.clone().add(neck.clone().sub(head('spine.003')).normalize().multiplyScalar(26)),
      front: k.front,
      arms: [arm('R'), arm('L')],
      legs: [leg('R'), leg('L')],
    };
  }
}

/* ================================================================== rig */

export class BodyRig {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(26, 1.2, 1, 5000);
  private readonly def: Movement;
  private readonly front: boolean;
  private readonly prone: number;
  private readonly updaters: ((f: Figure, s: Skeleton) => void)[] = [];
  private readonly bounds = new Box3();
  private fitPoints: Vector3[] = [];
  private readonly center = new Vector3();
  private readonly s = res();
  private readonly human: Human;
  private readonly skin: MeshStandardMaterial;
  private keyLight: DirectionalLight | null = null;
  private dist = 300;
  private aspect = 1.2;
  az: number;
  el: number;

  constructor(
    asset: HumanAsset,
    movement: string,
    private readonly equipment: Equipment,
    muscle: MuscleSlug | null,
    secondary: MuscleSlug[],
    private readonly opts: RigOptions,
  ) {
    this.def = MOVEMENTS[movement] ?? MOVEMENTS[MOVEMENT_FALLBACK];
    this.front = this.def.view === 'front';
    this.prone = this.def.prone ? -1 : 1;
    [this.az, this.el] = this.defaultView();
    this.skin = skinMaterial(muscle, secondary);
    this.human = new Human(asset, this.skin, opts.shadows, (a, b) => this.limbFront(a, b));
    this.scene.add(this.human.root);
    this.buildImplement();
    if (!opts.fit) this.buildProps();
    this.computeBounds();
    this.buildEnvironment();
  }

  private defaultView(): [number, number] {
    return this.front ? [18, 10] : [36, 15];
  }

  /* ---------------------------------------------------------------- quadro */

  update(phase: number): void {
    const f = solve(poseAt(this.def, phase), this.def.anchor, this.front);
    const real = this.human.pose(this.skeleton(f), this.def.anchor);
    for (const u of this.updaters) u(f, real);
  }

  setAspect(aspect: number): void {
    this.aspect = aspect;
    this.frame();
  }

  orbitBy(dAz: number, dEl: number): void {
    this.az = Math.max(-60, Math.min(70, this.az + dAz));
    this.el = Math.max(0, Math.min(35, this.el + dEl));
    this.placeCamera();
  }

  resetView(): void {
    [this.az, this.el] = this.defaultView();
    this.placeCamera();
  }

  dispose(): void {
    this.keyLight?.shadow.map?.dispose();
    this.skin.dispose();
    this.scene.clear();
  }

  /* ---------------------------------------------------------------- esqueleto-alvo */

  private limbFront(a: Vector3, b: Vector3): Vector3 {
    if (this.front) return new Vector3(0, 0, 1);
    const u = new Vector3().subVectors(b, a).normalize();
    return new Vector3(-u.y, u.x, 0);
  }

  private mesh(geo: BufferGeometry, mat: Material): Mesh {
    const m = new Mesh(geo, mat);
    m.castShadow = this.opts.shadows;
    this.scene.add(m);
    return m;
  }

  private skeleton(f: Figure): Skeleton {
    const td = dir(f.torsoAngle + 90 * this.prone);
    const front = this.front ? new Vector3(0, 0, 1) : new Vector3(td[0], -td[1], 0);
    if (!this.front) {
      return {
        hip: V(f.hip), shoulder: V(f.shoulder), neck: V(f.neck), headTop: V(f.headTop), front,
        arms: [
          { s: V(f.shoulder, ARM_Z), e: V(f.elbow, ARM_Z), w: V(f.wrist, ARM_Z), f: V(f.fingers, ARM_Z) },
          { s: V(f.shoulder, -ARM_Z), e: V(f.fElbow, -ARM_Z), w: V(f.fWrist, -ARM_Z), f: V(f.fFingers, -ARM_Z) },
        ],
        legs: [
          { h: V(f.hip, LEG_Z), k: V(f.knee, LEG_Z), a: V(f.ankle, LEG_Z), t: V(f.toe, LEG_Z) },
          { h: V(f.hip, -LEG_Z), k: V(f.fKnee, -LEG_Z), a: V(f.fAnkle, -LEG_Z), t: V(f.fToe, -LEG_Z) },
        ],
      };
    }
    const cx = f.hip[0];
    const mir = (p: Pt): Pt => [2 * cx - p[0], p[1]];
    const sL: Pt = [f.shoulder[0] + FRONT_SHOULDER[0], f.shoulder[1] + FRONT_SHOULDER[1]];
    const hL: Pt = [f.hip[0] + FRONT_HIP[0], f.hip[1] + FRONT_HIP[1]];
    const toe = (a: Pt) => V(a).add(new Vector3(0, -3, 12));
    return {
      hip: V(f.hip), shoulder: V(f.shoulder), neck: V(f.neck), headTop: V(f.headTop), front,
      arms: [
        { s: V(sL), e: V(f.elbow), w: V(f.wrist), f: V(f.fingers) },
        { s: V(mir(sL)), e: V(mir(f.elbow)), w: V(mir(f.wrist)), f: V(mir(f.fingers)) },
      ],
      legs: [
        { h: V(hL), k: V(f.knee), a: V(f.ankle), t: toe(f.ankle) },
        { h: V(mir(hL)), k: V(mir(f.knee)), a: V(mir(f.ankle)), t: toe(mir(f.ankle)) },
      ],
    };
  }

  /* ---------------------------------------------------------------- implementos */

  private along(g: Group, geo: BufferGeometry, mat: Material, z: number, r: number, h: number): void {
    const m = new Mesh(geo, mat);
    m.rotation.x = Math.PI / 2;
    m.position.z = z;
    m.scale.set(r, h, r);
    m.castShadow = this.opts.shadows;
    g.add(m);
  }

  private barbell(): Group {
    const s = this.s;
    const g = new Group();
    this.along(g, s.cyl, s.steel, 0, 1.3, 104);
    for (const side of [-1, 1]) {
      this.along(g, s.disc, s.chrome, side * 33, 3.2, 2);
      this.along(g, s.cyl, s.chrome, side * 50, 2.4, 32);
      this.along(g, s.disc, s.rubber, side * 39, PLATE_R, 4.5);
      this.along(g, s.disc, s.chrome, side * 39, 4.5, 4.8);
      this.along(g, s.disc, s.rubber, side * 44.5, PLATE_R - 4, 4);
      this.along(g, s.disc, s.chrome, side * 48.5, 3.2, 3);
    }
    if (this.front) g.rotation.y = Math.PI / 2;
    this.scene.add(g);
    return g;
  }

  private dumbbell(): Group {
    const s = this.s;
    const g = new Group();
    this.along(g, s.cyl, s.chrome, 0, 1.4, 16);
    for (const side of [-1, 1]) {
      this.along(g, s.disc, s.rubber, side * 9, 6.8, 5);
      this.along(g, s.disc, s.chrome, side * 11.6, 2.2, 0.6);
    }
    this.scene.add(g);
    return g;
  }

  private kettlebell(): Group {
    const s = this.s;
    const g = new Group();
    const bell = new Mesh(s.ball, s.rubber);
    bell.scale.setScalar(8);
    bell.position.y = -10;
    const handle = new Mesh(s.torus, s.steel);
    handle.scale.setScalar(4.6);
    handle.position.y = -1;
    bell.castShadow = handle.castShadow = this.opts.shadows;
    g.add(bell, handle);
    this.scene.add(g);
    return g;
  }

  private handle(): Mesh {
    const m = this.mesh(this.s.cyl, this.s.chrome);
    m.rotation.x = Math.PI / 2;
    m.scale.set(1.6, 12, 1.6);
    return m;
  }

  private hasBar(): boolean {
    const eq = this.equipment;
    const impl = this.def.implement ?? 'auto';
    return (eq === 'BARBELL' || eq === 'SMITH') && !this.def.cable && (impl === 'auto' || impl === 'backbar' || impl === 'hip');
  }

  private buildImplement(): void {
    const impl = this.def.implement ?? 'auto';
    const eq = this.equipment;
    if (impl === 'none') return;
    const mid = (a: Vector3, b: Vector3) => a.clone().add(b).multiplyScalar(0.5);
    const atHands = (make: () => Mesh | Group) => {
      const items = [make(), make()];
      this.updaters.push((_f, k) => items.forEach((it, i) => it.position.copy(k.arms[i].f)));
    };
    const bar = (point: (k: Skeleton) => Vector3) => {
      const g = this.barbell();
      this.updaters.push((_f, k) => g.position.copy(point(k)));
    };

    if (impl === 'backbar') {
      if (eq === 'KETTLEBELL' || eq === 'DUMBBELL') {
        const kb = this.kettlebell();
        this.updaters.push((_f, k) => kb.position.copy(mid(k.arms[0].f, k.arms[1].f)));
      } else if (eq !== 'BODYWEIGHT') {
        bar((k) => {
          const up = k.neck.clone().sub(k.shoulder).normalize();
          const p = k.neck.clone().addScaledVector(k.front, -9).addScaledVector(up, -3);
          if (!this.front) p.z = 0;
          return p;
        });
      }
      return;
    }
    if (impl === 'hip') {
      if (eq !== 'BODYWEIGHT') bar((k) => k.hip.clone().add(new Vector3(0, 13, 0)).setZ(0));
      return;
    }
    if (impl === 'ankle-pad') {
      const pad = this.mesh(this.s.cyl, this.s.pad);
      pad.rotation.x = Math.PI / 2;
      pad.scale.set(5.5, 34, 5.5);
      this.updaters.push((_f, k) => pad.position.copy(mid(k.legs[0].a, k.legs[1].a)));
      return;
    }
    if (impl === 'sled') {
      const sled = this.mesh(this.s.box, this.s.frame);
      this.updaters.push((_f, k) => {
        const l = k.legs[0];
        const sh = l.a.clone().sub(l.k).normalize();
        const u = new Vector3(-sh.y, sh.x, 0).multiplyScalar(22);
        const t = mid(l.t, k.legs[1].t);
        place(sled, t.clone().sub(u), t.clone().add(u), 4, 50);
      });
      return;
    }
    const cable = this.def.cable;
    if (cable) {
      atHands(() => this.handle());
      const line = this.mesh(this.s.cyl, this.s.cable);
      line.castShadow = false;
      const pulley = this.mesh(this.s.disc, this.s.steel);
      pulley.rotation.x = Math.PI / 2;
      const origin = V(cable, this.front ? 0 : ARM_Z);
      pulley.position.copy(origin);
      pulley.scale.set(4.5, 3, 4.5);
      this.updaters.push((_f, k) => place(line, origin, k.arms[0].f, 0.7, 0.7));
      return;
    }
    switch (eq) {
      case 'BARBELL':
      case 'SMITH':
        bar((k) => mid(k.arms[0].f, k.arms[1].f));
        break;
      case 'DUMBBELL':
        atHands(() => this.dumbbell());
        break;
      case 'KETTLEBELL': {
        const kb = this.kettlebell();
        this.updaters.push((_f, k) => kb.position.copy(mid(k.arms[0].f, k.arms[1].f)));
        break;
      }
      case 'MACHINE':
      case 'CABLE':
        atHands(() => this.handle());
        break;
      default:
        break;
    }
  }

  /* ---------------------------------------------------------------- aparelhos */

  private slab(a: Vector3, b: Vector3, thick: number, depth: number, mat: Material): Mesh {
    const m = this.mesh(this.s.box, mat);
    m.receiveShadow = true;
    place(m, a, b, thick, depth);
    return m;
  }

  private post(x: number, yTop: number, z: number, w = 4.5): void {
    this.slab(new Vector3(x, 0, z), new Vector3(x, yTop, z), w, w, this.s.frame);
  }

  private movementKey(): string {
    return Object.keys(MOVEMENTS).find((k) => MOVEMENTS[k] === this.def) ?? '';
  }

  private buildProps(): void {
    const s = this.s;
    for (const p of this.def.props ?? []) this.prop(p);

    // Rack de supino na cabeceira do banco (suportes em J), como nos bancos de academia.
    const isPress = /^PRESS_/.test(this.movementKey()) && this.equipment === 'BARBELL';
    const hasBench = (this.def.props ?? []).some((p) => p.kind === 'bench' || p.kind === 'incline');
    if (isPress && hasBench) {
      const top = solve(poseAt(this.def, 1), this.def.anchor, this.front);
      const real = this.human.pose(this.skeleton(top), this.def.anchor);
      const bar = real.arms[0].f.clone().add(real.arms[1].f).multiplyScalar(0.5);
      const headSide = Math.sign(top.shoulder[0] - top.hip[0]) || -1;
      const x = real.headTop.x + headSide * 6;
      const hookY = bar.y + 2;
      for (const z of [-30, 30]) {
        this.post(x, hookY + 10, z);
        this.slab(new Vector3(x, hookY - 2.5, z), new Vector3(x - headSide * 7, hookY - 2.5, z), 2.5, 4, s.frame);
        this.slab(new Vector3(x - headSide * 7, hookY - 2.5, z), new Vector3(x - headSide * 7, hookY + 2, z), 2, 4, s.frame);
        this.slab(new Vector3(x - 14, 1.5, z), new Vector3(x + 14, 1.5, z), 3, 5, s.frame);
      }
      this.slab(new Vector3(x, 10, -30), new Vector3(x, 10, 30), 3.5, 3.5, s.frame);
    }
  }

  private prop(p: Prop): void {
    const s = this.s;
    const leg = (x: number, y: number, z = 0) => this.slab(V([x, y], z), V([x, FLOOR], z), 3.5, 3.5, s.frame);
    const pad = (a: Pt, b: Pt, thick: number, depth: number) => this.slab(V(a), V(b), thick, depth, s.pad);
    switch (p.kind) {
      case 'bench':
        pad([p.x1, p.y + 3.5], [p.x2, p.y + 3.5], 7, 28);
        this.slab(V([p.x1 + 6, p.y + 8.5]), V([p.x2 - 6, p.y + 8.5]), 3, 8, s.frame);
        for (const x of [p.x1 + 10, p.x2 - 10]) {
          leg(x, p.y + 8);
          this.slab(V([x, FLOOR - 1.5], -16), V([x, FLOOR - 1.5], 16), 3, 4, s.frame);
        }
        break;
      case 'incline':
        pad(p.from, p.to, 7, 28);
        leg(p.from[0], p.from[1]);
        leg((p.from[0] + p.to[0]) / 2, (p.from[1] + p.to[1]) / 2 + 4);
        break;
      case 'seat':
        pad([p.x, p.y + 3.5], [p.x + p.w, p.y + 3.5], 7, 30);
        leg(p.x + p.w / 2, p.y + 7);
        break;
      case 'scott':
        pad(p.from, p.to, 7, 30);
        leg(p.to[0] - 8, p.to[1]);
        break;
      case 'step':
        this.slab(V([p.x, p.y - 4]), V([p.x + p.w, p.y - 4]), 8, 40, s.pad);
        break;
      case 'mat':
        this.slab(V([p.x1, FLOOR - 1.5]), V([p.x2, FLOOR - 1.5]), 3, 54, s.prop);
        break;
      case 'tower':
        this.slab(V([p.x, 4], this.front ? -14 : ARM_Z), V([p.x, FLOOR], this.front ? -14 : ARM_Z), 9, 9, s.frame);
        break;
      case 'bar':
        for (const z of [-19, 19]) {
          const rod = this.mesh(s.cyl, s.chrome);
          place(rod, V([p.x1, p.y], z), V([p.x2, p.y], z), 2, 2);
          leg(p.x1, p.y, z);
          leg(p.x2, p.y, z);
        }
        break;
      case 'posts': {
        const rod = this.mesh(s.cyl, s.chrome);
        place(rod, V([p.x, p.y], -46), V([p.x, p.y], 46), 1.8, 1.8);
        for (const z of [-46, 46]) this.post(p.x + 10, FLOOR - p.y + 4, z);
        break;
      }
    }
  }

  /* ---------------------------------------------------------------- enquadramento e luz */

  private computeBounds(): void {
    const pts: Vector3[] = [];
    const bar = this.hasBar();
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      const f = solve(poseAt(this.def, phase), this.def.anchor, this.front);
      const k = this.human.pose(this.skeleton(f), this.def.anchor);
      pts.push(k.hip, k.shoulder, k.headTop, ...k.arms.flatMap((a) => [a.s, a.e, a.w, a.f]), ...k.legs.flatMap((l) => [l.h, l.k, l.a, l.t]));
      if (bar && this.def.implement !== 'backbar' && this.def.implement !== 'hip') {
        const g = k.arms[0].f.clone().add(k.arms[1].f).multiplyScalar(0.5);
        for (const sgn of [-1, 1]) for (const dy of [-PLATE_R, PLATE_R]) {
          pts.push(this.front ? new Vector3(g.x + sgn * 50, g.y + dy, 0) : new Vector3(g.x, g.y + dy, sgn * 50));
        }
      }
    }
    if (!this.opts.fit) {
      for (const p of this.def.props ?? []) {
        const xs = 'x1' in p ? [p.x1, p.x2] : 'from' in p ? [p.from[0], p.to[0]] : 'w' in p ? [p.x, p.x + p.w] : [p.x];
        for (const x of xs) for (const z of [-16, 16]) pts.push(new Vector3(x, 1, z));
      }
    }
    const pad = this.opts.fit ? 8 : 11;
    this.fitPoints = pts.flatMap((p) => [p.clone().add(new Vector3(0, pad, 0)), p.clone().add(new Vector3(0, -pad, 0)),
      p.clone().add(new Vector3(pad, 0, 0)), p.clone().add(new Vector3(-pad, 0, 0))]);
    this.fitPoints.push(...pts.map((p) => new Vector3(p.x, 0, p.z)));
    this.bounds.setFromPoints(this.fitPoints);
    this.bounds.getCenter(this.center);
  }

  private buildEnvironment(): void {
    const s = this.s;
    const size = new Vector3();
    this.bounds.getSize(size);
    const span = Math.max(size.x, size.z, 80);

    this.scene.add(new HemisphereLight(0xf4f4f8, 0x1a0508, 1.1));
    const key = new DirectionalLight(0xffffff, 2.5);
    key.position.set(this.center.x + 80, 240, 190);
    key.target.position.copy(this.center);
    this.scene.add(key, key.target);
    if (this.opts.shadows) {
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      const r = span * 0.8 + 40;
      Object.assign(key.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 10, far: 900 });
      key.shadow.bias = -0.0006;
      key.shadow.normalBias = 0.6;
      key.shadow.radius = 4;
      this.keyLight = key;
    }
    const fill = new DirectionalLight(0xdfe6ff, 0.8);
    fill.position.set(this.center.x - 160, 120, 120);
    fill.target.position.copy(this.center);
    const rim = new DirectionalLight(0xff2a3a, 1.3);
    rim.position.set(this.center.x - 120, 90, -170);
    rim.target.position.copy(this.center);
    this.scene.add(fill, fill.target, rim, rim.target);

    if (!this.opts.fit) {
      const floor = new Mesh(new CircleGeometry(1, 64), s.floor);
      floor.rotation.x = -Math.PI / 2;
      floor.scale.setScalar(span * 2 + 200);
      floor.position.set(this.center.x, 0, 0);
      floor.receiveShadow = true;
      this.scene.add(floor);
    }
    const glow = new Mesh(s.plane, s.glow);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(this.center.x, 0.15, 0);
    glow.scale.set(span * 1.5, span * 0.9, 1);
    const contact = new Mesh(s.plane, s.contact);
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(this.center.x, 0.3, 0);
    contact.scale.set(size.x * 0.9 + 20, 46, 1);
    this.scene.add(glow, contact);
  }

  private dirFor(azDeg: number, elDeg: number): Vector3 {
    const az = rad(azDeg); const el = rad(elDeg);
    return new Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
  }

  private fitDistance(azDeg: number, elDeg: number): number {
    const fwd = this.dirFor(azDeg, elDeg);
    const right = new Vector3().crossVectors(UP, fwd).normalize();
    const up = new Vector3().crossVectors(fwd, right);
    const vt = Math.tan(rad(this.camera.fov / 2));
    const ht = vt * this.aspect;
    let need = 0;
    const c = new Vector3();
    for (const p of this.fitPoints) {
      c.subVectors(p, this.center);
      const depth = c.dot(fwd);
      need = Math.max(need, Math.abs(c.dot(up)) / vt + depth, Math.abs(c.dot(right)) / ht + depth);
    }
    return need * (this.opts.fit ? 1.02 : 1.06);
  }

  private frame(): void {
    if (this.opts.orbit) {
      let d = 0;
      for (let a = -60; a <= 70; a += 10) d = Math.max(d, this.fitDistance(a, this.el));
      this.dist = d;
    } else {
      this.dist = this.fitDistance(this.az, this.el);
    }
    this.placeCamera();
  }

  private placeCamera(): void {
    const c = this.camera;
    c.aspect = this.aspect;
    c.position.copy(this.center).addScaledVector(this.dirFor(this.az, this.el), this.dist);
    c.lookAt(this.center);
    c.near = Math.max(1, this.dist - 600);
    c.far = this.dist + 1200;
    c.updateProjectionMatrix();
  }
}
