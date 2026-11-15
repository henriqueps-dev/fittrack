import { Anchor, Movement, Pose } from './movements';

/**
 * Cinematica direta do boneco, no plano do desenho (x para a direita, y para baixo, chao em y = 181).
 * O renderizador 3D converte esses pontos para o espaco do three.js.
 */
export type Pt = [number, number];

export interface Figure {
  hip: Pt; shoulder: Pt; neck: Pt; head: Pt; headTop: Pt; elbow: Pt; wrist: Pt; fingers: Pt; knee: Pt; ankle: Pt; toe: Pt;
  fElbow: Pt; fWrist: Pt; fFingers: Pt; fKnee: Pt; fAnkle: Pt; fToe: Pt;
  torsoAngle: number; uaAngle: number; faAngle: number; thAngle: number; shAngle: number;
}

export const L = { torso: 54, neck: 7, head: 10, ua: 30, fa: 27, hand: 8, th: 38, sh: 36, ft: 11 };
/** Deslocamentos laterais (vista frontal) do ombro e do quadril em relacao ao centro do corpo. */
export const FRONT_SHOULDER: Pt = [-18, 5];
export const FRONT_HIP: Pt = [-9, 0];

export const rad = (d: number) => (d * Math.PI) / 180;
export const dir = (a: number): Pt => [Math.cos(rad(a)), Math.sin(rad(a))];
export const add = (p: Pt, a: number, len: number): Pt => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => t * t * (3 - 2 * t);

/** Pose interpolada entre a posicao inicial (0) e final (1) do movimento. */
export function poseAt(def: Movement, phase: number): Pose {
  const { a, b } = def;
  const t = ease(Math.min(1, Math.max(0, phase)));
  const mix = (x?: number, y?: number, fb?: number) => lerp(x ?? fb ?? 0, y ?? x ?? fb ?? 0, t);
  const opt = (x?: number, y?: number) => (x === undefined ? undefined : mix(x, y));
  return {
    torso: mix(a.torso, b.torso), ua: mix(a.ua, b.ua), fa: mix(a.fa, b.fa), th: mix(a.th, b.th), sh: mix(a.sh, b.sh),
    ft: mix(a.ft, b.ft, 0), hand: opt(a.hand, b.hand),
    fua: opt(a.fua, b.fua), ffa: opt(a.ffa, b.ffa), fth: opt(a.fth, b.fth), fsh: opt(a.fsh, b.fsh), fft: opt(a.fft, b.fft),
    torsoLen: mix(a.torsoLen, b.torsoLen, L.torso),
    at: [lerp(a.at[0], b.at[0], t), lerp(a.at[1], b.at[1], t)],
  };
}

export function solve(p: Pose, anchor: Anchor, front: boolean): Figure {
  const hip: Pt = [0, 0];
  const tl = p.torsoLen ?? L.torso;
  const shoulder = add(hip, p.torso, tl);
  const neck = add(shoulder, p.torso, L.neck);
  const head = add(neck, p.torso, L.head);
  const headTop = add(head, p.torso, L.head);
  const sOff: Pt = front ? FRONT_SHOULDER : [0, 0];
  const hOff: Pt = front ? FRONT_HIP : [0, 0];
  const sBase: Pt = [shoulder[0] + sOff[0], shoulder[1] + sOff[1]];
  const hBase: Pt = [hip[0] + hOff[0], hip[1] + hOff[1]];
  const uaA = front ? 180 - p.ua : p.ua;
  const faA = front ? 180 - p.fa : p.fa;
  const thA = front ? 180 - p.th : p.th;
  const shA = front ? 180 - p.sh : p.sh;
  const elbow = add(sBase, uaA, L.ua);
  const wrist = add(elbow, faA, L.fa);
  const fingers = add(wrist, p.hand ?? faA, L.hand);
  const knee = add(hBase, thA, L.th);
  const ankle = add(knee, shA, L.sh);
  const toe = add(ankle, p.ft ?? 0, L.ft);
  const fElbow = add(shoulder, p.fua ?? p.ua, L.ua);
  const fWrist = add(fElbow, p.ffa ?? p.fa, L.fa);
  const fFingers = add(fWrist, p.hand ?? p.ffa ?? p.fa, L.hand);
  const fKnee = add(hip, p.fth ?? p.th, L.th);
  const fAnkle = add(fKnee, p.fsh ?? p.sh, L.sh);
  const fToe = add(fAnkle, p.fft ?? p.ft ?? 0, L.ft);

  const anchorPt: Pt = anchor === 'hand' ? wrist : anchor === 'foot' ? ankle : anchor === 'toe' ? toe : hip;
  const dx = p.at[0] - anchorPt[0];
  const dy = p.at[1] - anchorPt[1];
  const m = (q: Pt): Pt => [q[0] + dx, q[1] + dy];
  return {
    hip: m(hip), shoulder: m(shoulder), neck: m(neck), head: m(head), headTop: m(headTop), elbow: m(elbow), wrist: m(wrist),
    fingers: m(fingers), knee: m(knee), ankle: m(ankle), toe: m(toe),
    fElbow: m(fElbow), fWrist: m(fWrist), fFingers: m(fFingers), fKnee: m(fKnee), fAnkle: m(fAnkle), fToe: m(fToe),
    torsoAngle: p.torso, uaAngle: uaA, faAngle: faA, thAngle: thA, shAngle: shA,
  };
}
