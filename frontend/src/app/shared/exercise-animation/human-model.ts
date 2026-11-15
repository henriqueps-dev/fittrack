import { BufferAttribute, BufferGeometry, Object3D, SkinnedMesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MuscleSlug } from '../../core/models/api.models';

/**
 * Modelo humano (CC0 "Male Base Mesh", BoQsc) carregado uma unica vez:
 * - suavizado por subdivisao Loop (2 niveis), interpolando tambem os pesos do esqueleto;
 * - recebe 3 atributos vec4 (m0, m1, m2) com o peso de cada musculo por vertice, usados pelo shader
 *   para pintar o musculo trabalhado direto na pele.
 */
export const MUSCLE_SLOTS: MuscleSlug[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'quads', 'hamstrings', 'glutes', 'calves',
];

export interface HumanAsset { scene: Object3D; }

let pending: Promise<HumanAsset> | null = null;

export function loadHuman(): Promise<HumanAsset> {
  pending ??= new GLTFLoader().loadAsync('/models/male-base.glb').then((gltf) => prepare(gltf.scene));
  pending.catch(() => { pending = null; });
  return pending;
}

function prepare(scene: Object3D): HumanAsset {
  scene.updateMatrixWorld(true);
  let skinned: SkinnedMesh | null = null;
  scene.traverse((o) => { if ((o as SkinnedMesh).isSkinnedMesh) skinned = o as SkinnedMesh; });
  if (!skinned) throw new Error('modelo sem malha com esqueleto');
  const mesh = skinned as SkinnedMesh;
  const base = mesh.geometry.clone();
  for (const name of Object.keys(base.attributes)) {
    if (!['position', 'skinIndex', 'skinWeight'].includes(name)) base.deleteAttribute(name);
  }
  const merged = mergeVertices(base, 1e-4);
  const smooth = loopSubdivide(loopSubdivide(merged));
  mesh.geometry = smooth;
  paintMuscles(smooth, mesh);
  smooth.computeVertexNormals();
  smooth.computeBoundingSphere();
  return { scene };
}

/* ------------------------------------------------------------------ subdivisao Loop */

interface Skin { idx: number[]; w: number[]; }

function readSkin(g: BufferGeometry, i: number): Skin {
  const si = g.getAttribute('skinIndex');
  const sw = g.getAttribute('skinWeight');
  return { idx: [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)], w: [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)] };
}

function blendSkin(parts: [Skin, number][]): Skin {
  const acc = new Map<number, number>();
  for (const [s, f] of parts) for (let k = 0; k < 4; k++) if (s.w[k] > 0) acc.set(s.idx[k], (acc.get(s.idx[k]) ?? 0) + s.w[k] * f);
  const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sum = top.reduce((t, [, w]) => t + w, 0) || 1;
  const idx = [0, 0, 0, 0]; const w = [0, 0, 0, 0];
  top.forEach(([i, wt], k) => { idx[k] = i; w[k] = wt / sum; });
  return { idx, w };
}

function loopSubdivide(g: BufferGeometry): BufferGeometry {
  const pos = g.getAttribute('position');
  const index = g.getIndex()!.array;
  const n = pos.count;
  const P = (i: number) => new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
  const skins: Skin[] = Array.from({ length: n }, (_, i) => readSkin(g, i));

  interface Edge { a: number; b: number; opp: number[]; id: number; }
  const edges = new Map<number, Edge>();
  const nbrs: Set<number>[] = Array.from({ length: n }, () => new Set<number>());
  const key = (a: number, b: number) => (a < b ? a * n + b : b * n + a);
  const tris: [number, number, number][] = [];
  for (let t = 0; t < index.length; t += 3) {
    const tri: [number, number, number] = [index[t], index[t + 1], index[t + 2]];
    tris.push(tri);
    for (let k = 0; k < 3; k++) {
      const a = tri[k]; const b = tri[(k + 1) % 3]; const c = tri[(k + 2) % 3];
      const kk = key(a, b);
      let e = edges.get(kk);
      if (!e) { e = { a, b, opp: [], id: -1 }; edges.set(kk, e); }
      e.opp.push(c);
      nbrs[a].add(b); nbrs[b].add(a);
    }
  }

  const outPos: Vector3[] = [];
  const outSkin: Skin[] = [];
  // vertices antigos reposicionados
  for (let v = 0; v < n; v++) {
    const boundary = [...nbrs[v]].filter((u) => edges.get(key(v, u))!.opp.length < 2);
    const p = P(v);
    if (boundary.length) {
      if (boundary.length === 2) p.multiplyScalar(0.75).addScaledVector(P(boundary[0]).add(P(boundary[1])), 0.125);
    } else {
      const k = nbrs[v].size;
      const beta = k === 3 ? 3 / 16 : 3 / (8 * k);
      const sum = new Vector3();
      nbrs[v].forEach((u) => sum.add(P(u)));
      p.multiplyScalar(1 - k * beta).addScaledVector(sum, beta);
    }
    outPos.push(p);
    outSkin.push(skins[v]);
  }
  // vertices novos nas arestas
  for (const e of edges.values()) {
    e.id = outPos.length;
    const pa = P(e.a); const pb = P(e.b);
    if (e.opp.length === 2) {
      outPos.push(pa.add(pb).multiplyScalar(3 / 8).addScaledVector(P(e.opp[0]).add(P(e.opp[1])), 1 / 8));
    } else {
      outPos.push(pa.add(pb).multiplyScalar(0.5));
    }
    outSkin.push(blendSkin([[skins[e.a], 0.5], [skins[e.b], 0.5]]));
  }

  const idx: number[] = [];
  const eid = (a: number, b: number) => edges.get(key(a, b))!.id;
  for (const [a, b, c] of tris) {
    const ab = eid(a, b); const bc = eid(b, c); const ca = eid(c, a);
    idx.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
  }

  const m = outPos.length;
  const posArr = new Float32Array(m * 3);
  const siArr = new Uint16Array(m * 4);
  const swArr = new Float32Array(m * 4);
  outPos.forEach((p, i) => { posArr[i * 3] = p.x; posArr[i * 3 + 1] = p.y; posArr[i * 3 + 2] = p.z; });
  outSkin.forEach((s, i) => { for (let k = 0; k < 4; k++) { siArr[i * 4 + k] = s.idx[k]; swArr[i * 4 + k] = s.w[k]; } });
  const out = new BufferGeometry();
  out.setAttribute('position', new BufferAttribute(posArr, 3));
  out.setAttribute('skinIndex', new BufferAttribute(siArr, 4));
  out.setAttribute('skinWeight', new BufferAttribute(swArr, 4));
  out.setIndex(idx);
  return out;
}

/* ------------------------------------------------------------------ mapa de musculos */

const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const band = (x: number, a: number, b: number, e = 0.1) => ss(a - e, a + e, x) * (1 - ss(b - e, b + e, x));

function paintMuscles(g: BufferGeometry, mesh: SkinnedMesh): void {
  const bones = mesh.skeleton.bones;
  // o GLTFLoader remove '.' dos nomes (spine.001 -> spine001)
  const key = (n: string) => n.replace(/\./g, '');
  const byName = new Map<string, number>(bones.map((b, i) => [key(b.name), i]));
  const head = (name: string) => bones[byName.get(key(name))!].getWorldPosition(new Vector3());

  const hip = head('spine');
  const neck = head('spine.004');
  const U0 = neck.clone().sub(hip).normalize();
  const R0 = head('thigh.R').sub(head('thigh.L')).normalize();
  const F0 = new Vector3().crossVectors(U0, R0).normalize();
  const torsoLen = neck.distanceTo(hip);

  interface Limb { h: Vector3; axis: Vector3; len: number; front: Vector3; }
  const limb = (bone: string, child: string): Limb => {
    const h = head(bone); const c = head(child);
    const axis = c.clone().sub(h); const len = axis.length(); axis.normalize();
    const front = F0.clone().addScaledVector(axis, -F0.dot(axis)).normalize();
    return { h, axis, len, front };
  };
  const limbs: Record<string, Limb> = {};
  for (const s of ['L', 'R']) {
    limbs[`upper_arm.${s}`] = limb(`upper_arm.${s}`, `forearm.${s}`);
    limbs[`forearm.${s}`] = limb(`forearm.${s}`, `hand.${s}`);
    limbs[`thigh.${s}`] = limb(`thigh.${s}`, `shin.${s}`);
    limbs[`shin.${s}`] = limb(`shin.${s}`, `foot.${s}`);
  }
  const shoulderJoint = { L: head('upper_arm.L'), R: head('upper_arm.R') };

  const pos = g.getAttribute('position');
  const si = g.getAttribute('skinIndex');
  const sw = g.getAttribute('skinWeight');
  const n = pos.count;
  const m = [new Float32Array(n * 4), new Float32Array(n * 4), new Float32Array(n * 4)];
  const slot = new Map(MUSCLE_SLOTS.map((s, i) => [s, i]));
  const w = new Vector3();
  const d = new Vector3();

  for (let i = 0; i < n; i++) {
    // posicao real do vertice com o esqueleto atual (a pose de repouso pode diferir da de ligacao)
    mesh.applyBoneTransform(i, w.set(pos.getX(i), pos.getY(i), pos.getZ(i))).applyMatrix4(mesh.matrixWorld);
    const bw = new Map<string, number>();
    for (let k = 0; k < 4; k++) {
      const wt = sw.getComponent(i, k);
      if (wt > 0) { const nm = key(bones[si.getComponent(i, k)].name); bw.set(nm, (bw.get(nm) ?? 0) + wt); }
    }
    const sum = (...names: string[]) => names.reduce((t, nm) => t + (bw.get(key(nm)) ?? 0), 0);
    const val = new Map<MuscleSlug, number>();
    const put = (mu: MuscleSlug, v: number) => val.set(mu, Math.max(val.get(mu) ?? 0, Math.min(1, v)));

    // tronco
    d.copy(w).sub(hip);
    const h = d.dot(U0) / torsoLen;
    const f = d.dot(F0);
    const l = d.dot(R0);
    const fn = f / (Math.hypot(f, l) || 1);
    const limbW = sum('upper_arm.L', 'upper_arm.R', 'forearm.L', 'forearm.R', 'hand.L', 'hand.R',
      'thigh.L', 'thigh.R', 'shin.L', 'shin.R', 'foot.L', 'foot.R');
    const torsoW = Math.max(0, 1 - 0.75 * limbW) * (1 - ss(0.95, 1.05, h));
    put('chest', 1.25 * torsoW * ss(-0.05, 0.45, fn) * band(h, 0.54, 0.92, 0.08) * (1 - ss(0.16, 0.26, Math.abs(l))));
    put('abs', torsoW * ss(0.25, 0.55, fn) * band(h, 0.1, 0.56) * (1 - ss(0.08, 0.11, Math.abs(l))));
    put('abs', torsoW * band(fn, -0.15, 0.55, 0.12) * band(h, 0.18, 0.55) * 0.9);
    put('back', torsoW * ss(0.15, 0.45, -fn) * band(h, 0.28, 0.98));
    put('glutes', Math.max(torsoW, sum('thigh.L', 'thigh.R')) * ss(0.15, 0.45, -fn) * band(h, -0.4, 0.1));

    for (const s of ['L', 'R'] as const) {
      // deltoide: em volta da articulacao do ombro
      const ds = w.distanceTo(shoulderJoint[s]);
      put('shoulders', (1 - ss(0.06, 0.15, ds)) * ss(-0.04, 0.02, w.clone().sub(hip).dot(R0) * (s === 'R' ? 1 : -1) - 0.12));

      const side = (name: string) => {
        const L = limbs[name];
        d.copy(w).sub(L.h);
        const t = d.dot(L.axis) / L.len;
        d.addScaledVector(L.axis, -d.dot(L.axis));
        const sd = d.lengthSq() > 1e-10 ? d.normalize().dot(L.front) : 0;
        return { t, sd };
      };
      const ua = side(`upper_arm.${s}`);
      const uaW = sum(`upper_arm.${s}`);
      put('biceps', uaW * band(ua.t, 0.28, 0.9) * ss(-0.15, 0.55, ua.sd));
      put('triceps', uaW * band(ua.t, 0.2, 0.92) * ss(-0.15, 0.55, -ua.sd));
      const fa = side(`forearm.${s}`);
      put('forearms', sum(`forearm.${s}`) * band(fa.t, -0.1, 0.8));
      const th = side(`thigh.${s}`);
      const thW = sum(`thigh.${s}`);
      put('quads', thW * band(th.t, 0.1, 0.92) * ss(-0.3, 0.45, th.sd));
      put('hamstrings', thW * band(th.t, 0.22, 0.9) * ss(-0.1, 0.6, -th.sd));
      const sh = side(`shin.${s}`);
      put('calves', sum(`shin.${s}`) * band(sh.t, 0.04, 0.58) * ss(-0.15, 0.55, -sh.sd));
    }

    for (const [mu, v] of val) {
      const k = slot.get(mu)!;
      m[k >> 2][i * 4 + (k & 3)] = v;
    }
  }
  g.setAttribute('m0', new BufferAttribute(m[0], 4));
  g.setAttribute('m1', new BufferAttribute(m[1], 4));
  g.setAttribute('m2', new BufferAttribute(m[2], 4));
}

