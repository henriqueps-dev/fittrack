/**
 * Biblioteca de movimentos para o boneco animado (vista lateral, olhando para a direita).
 *
 * Angulos em graus no sistema do SVG: 0 = direita, 90 = baixo, -90 = cima, 180 = esquerda.
 * Cada segmento usa angulo ABSOLUTO. O boneco e calculado por cinematica direta a partir do quadril
 * e depois transladado para que a articulacao "ancora" (pe, mao, ponta do pe ou quadril) fique fixa.
 */

export type Anchor = 'hip' | 'hand' | 'foot' | 'toe';

export interface Pose {
  torso: number;
  ua: number; // braco (ombro -> cotovelo)
  fa: number; // antebraco (cotovelo -> punho)
  th: number; // coxa (quadril -> joelho)
  sh: number; // canela (joelho -> tornozelo)
  ft?: number; // pe (tornozelo -> ponta)
  hand?: number; // mao (punho -> dedos), usado na rosca de punho
  fua?: number; ffa?: number; fth?: number; fsh?: number; fft?: number; // membros do lado oposto
  torsoLen?: number;
  at: [number, number]; // posicao da ancora
}

export type Prop =
  | { kind: 'bench'; x1: number; x2: number; y: number }
  | { kind: 'incline'; from: [number, number]; to: [number, number] }
  | { kind: 'bar'; x1: number; x2: number; y: number }
  | { kind: 'posts'; x: number; y: number }
  | { kind: 'seat'; x: number; y: number; w: number }
  | { kind: 'scott'; from: [number, number]; to: [number, number] }
  | { kind: 'step'; x: number; y: number; w: number }
  | { kind: 'tower'; x: number }
  | { kind: 'mat'; x1: number; x2: number };

export type Implement = 'auto' | 'none' | 'backbar' | 'chest' | 'hip' | 'ankle-pad' | 'sled';

export interface Movement {
  anchor: Anchor;
  a: Pose;
  b: Pose;
  view?: 'side' | 'front';
  props?: Prop[];
  /** Origem do cabo (polia) ligado a mao. */
  cable?: [number, number];
  implement?: Implement;
  /** Decubito ventral: a "frente" do tronco aponta para o chao. */
  prone?: boolean;
  /** Duracao de um ciclo completo em ms. */
  period?: number;
}

const FLOOR = 180;
const STAND: Omit<Pose, 'at'> = { torso: -90, ua: 88, fa: 88, th: 90, sh: 90, ft: 0 };
const LYING = { torso: 180, th: 22, sh: 96, ft: 0 } as const;
const BENCH: Prop = { kind: 'bench', x1: 60, x2: 172, y: 138 };

const standing = (p: Partial<Pose>, x = 118): Pose => ({ ...STAND, ...p, at: [x, FLOOR] });

export const MOVEMENTS: Record<string, Movement> = {
  PRESS_FLAT: {
    anchor: 'hip',
    props: [BENCH],
    a: { ...LYING, ua: 12, fa: -90, at: [150, 128] },
    b: { ...LYING, ua: -86, fa: -89, at: [150, 128] },
  },
  PRESS_INCLINE: {
    anchor: 'hip',
    props: [{ kind: 'incline', from: [150, 146], to: [92, 112] }, { kind: 'seat', x: 136, y: 146, w: 36 }],
    a: { torso: -150, ua: 38, fa: -100, th: 8, sh: 96, ft: 0, at: [150, 138] },
    b: { torso: -150, ua: -100, fa: -100, th: 8, sh: 96, ft: 0, at: [150, 138] },
  },
  PRESS_DECLINE: {
    anchor: 'hip',
    props: [{ kind: 'incline', from: [150, 130], to: [96, 146] }],
    a: { torso: 165, ua: 6, fa: -95, th: 30, sh: 100, ft: 0, at: [150, 122] },
    b: { torso: 165, ua: -80, fa: -86, th: 30, sh: 100, ft: 0, at: [150, 122] },
  },
  FLY: {
    anchor: 'hip',
    props: [BENCH],
    a: { ...LYING, ua: 55, fa: 25, at: [150, 128] },
    b: { ...LYING, ua: -88, fa: -92, at: [150, 128] },
  },
  CABLE_FLY: {
    anchor: 'foot',
    props: [{ kind: 'tower', x: 34 }],
    cable: [40, 40],
    a: standing({ torso: -80, ua: 188, fa: 172, th: 84, sh: 96 }),
    b: standing({ torso: -80, ua: 32, fa: 42, th: 84, sh: 96 }),
  },
  PUSHUP: {
    anchor: 'hand',
    a: { torso: -25, ua: 90, fa: 90, th: 155, sh: 155, ft: 115, at: [172, FLOOR] },
    b: { torso: -14, ua: 142, fa: 74, th: 166, sh: 166, ft: 110, at: [172, FLOOR] },
  },
  DIP: {
    anchor: 'hand',
    props: [{ kind: 'posts', x: 128, y: 106 }],
    a: { torso: -96, ua: 92, fa: 90, th: 105, sh: 150, ft: 60, at: [128, 106] },
    b: { torso: -100, ua: 128, fa: 66, th: 100, sh: 150, ft: 60, at: [128, 106] },
  },
  ROW_BENT: {
    anchor: 'foot',
    a: standing({ torso: -32, ua: 90, fa: 90, th: 72, sh: 104 }),
    b: standing({ torso: -32, ua: 160, fa: 92, th: 72, sh: 104 }),
  },
  ROW_SEATED: {
    anchor: 'hip',
    props: [{ kind: 'seat', x: 76, y: 156, w: 46 }, { kind: 'tower', x: 214 }],
    cable: [210, 140],
    a: { torso: -78, ua: 8, fa: 4, th: -4, sh: 20, ft: -70, at: [96, 150] },
    b: { torso: -96, ua: 128, fa: 6, th: -4, sh: 20, ft: -70, at: [96, 150] },
  },
  PULLDOWN: {
    anchor: 'hip',
    props: [{ kind: 'seat', x: 90, y: 156, w: 44 }, { kind: 'tower', x: 214 }],
    cable: [128, 6],
    a: { torso: -94, ua: -80, fa: -84, th: 0, sh: 92, ft: 0, at: [112, 150] },
    b: { torso: -100, ua: 116, fa: -76, th: 0, sh: 92, ft: 0, at: [112, 150] },
  },
  PULLUP: {
    anchor: 'hand',
    props: [{ kind: 'bar', x1: 80, x2: 180, y: 18 }],
    a: { torso: -90, ua: -90, fa: -90, th: 98, sh: 118, ft: 60, at: [130, 18] },
    b: { torso: -92, ua: 118, fa: -78, th: 96, sh: 120, ft: 60, at: [130, 18] },
  },
  DEADLIFT: {
    anchor: 'foot',
    a: standing({ torso: -38, ua: 90, fa: 90, th: 28, sh: 112 }),
    b: standing({ torso: -90, ua: 90, fa: 90, th: 90, sh: 90 }),
  },
  RDL: {
    anchor: 'foot',
    a: standing({ torso: -12, ua: 92, fa: 92, th: 76, sh: 96 }),
    b: standing({ torso: -90, ua: 90, fa: 90, th: 90, sh: 90 }),
  },
  OVERHEAD_PRESS: {
    anchor: 'foot',
    a: standing({ ua: 66, fa: -96 }),
    b: standing({ ua: -92, fa: -92 }),
  },
  LATERAL_RAISE: {
    anchor: 'foot',
    view: 'front',
    a: standing({ ua: 84, fa: 82 }, 120),
    b: standing({ ua: 4, fa: 0 }, 120),
  },
  FRONT_RAISE: {
    anchor: 'foot',
    a: standing({ ua: 86, fa: 86 }),
    b: standing({ ua: 2, fa: -2 }),
  },
  REAR_DELT: {
    anchor: 'foot',
    a: standing({ torso: -22, ua: 92, fa: 92, th: 78, sh: 100 }),
    b: standing({ torso: -22, ua: 196, fa: 192, th: 78, sh: 100 }),
  },
  SHRUG: {
    anchor: 'foot',
    view: 'front',
    a: standing({ ua: 90, fa: 90, torsoLen: 52 }, 120),
    b: standing({ ua: 90, fa: 90, torsoLen: 58 }, 120),
    period: 2000,
  },
  CURL: {
    anchor: 'foot',
    a: standing({ ua: 88, fa: 84 }),
    b: standing({ ua: 82, fa: -66 }),
  },
  PREACHER_CURL: {
    anchor: 'hip',
    props: [{ kind: 'seat', x: 82, y: 152, w: 40 }, { kind: 'scott', from: [112, 96], to: [146, 124] }],
    a: { torso: -82, ua: 40, fa: 48, th: 0, sh: 90, ft: 0, at: [100, 146] },
    b: { torso: -82, ua: 40, fa: -78, th: 0, sh: 90, ft: 0, at: [100, 146] },
  },
  PUSHDOWN: {
    anchor: 'foot',
    props: [{ kind: 'tower', x: 200 }],
    cable: [190, 16],
    a: standing({ torso: -82, ua: 94, fa: -12, th: 86, sh: 94 }),
    b: standing({ torso: -82, ua: 94, fa: 86, th: 86, sh: 94 }),
  },
  OVERHEAD_EXTENSION: {
    anchor: 'foot',
    a: standing({ ua: -98, fa: 118 }),
    b: standing({ ua: -96, fa: -94 }),
  },
  SKULL_CRUSHER: {
    anchor: 'hip',
    props: [BENCH],
    a: { ...LYING, ua: -102, fa: 166, at: [150, 128] },
    b: { ...LYING, ua: -96, fa: -96, at: [150, 128] },
  },
  KICKBACK_ARM: {
    anchor: 'foot',
    a: standing({ torso: -24, ua: 172, fa: 92, th: 76, sh: 102 }),
    b: standing({ torso: -24, ua: 172, fa: 176, th: 76, sh: 102 }),
  },
  WRIST_CURL: {
    anchor: 'hip',
    props: [{ kind: 'seat', x: 70, y: 148, w: 44 }],
    a: { torso: -78, ua: 62, fa: 2, th: 0, sh: 92, ft: 0, hand: 62, at: [96, 142] },
    b: { torso: -78, ua: 62, fa: 2, th: 0, sh: 92, ft: 0, hand: -44, at: [96, 142] },
    period: 1800,
  },
  CRUNCH: {
    anchor: 'hip',
    props: [{ kind: 'mat', x1: 40, x2: 200 }],
    a: { torso: 182, ua: 8, fa: 2, th: -52, sh: 58, ft: 0, at: [124, 172] },
    b: { torso: 208, ua: 12, fa: 6, th: -52, sh: 58, ft: 0, at: [124, 172] },
    period: 2200,
  },
  LEG_RAISE: {
    anchor: 'hip',
    props: [{ kind: 'mat', x1: 30, x2: 210 }],
    a: { torso: 180, ua: 2, fa: 2, th: 4, sh: 4, ft: -80, at: [118, 172] },
    b: { torso: 180, ua: 2, fa: 2, th: -86, sh: -86, ft: 4, at: [118, 172] },
  },
  PLANK: {
    anchor: 'hand',
    props: [{ kind: 'mat', x1: 30, x2: 210 }],
    a: { torso: -14, ua: 90, fa: 0, th: 167, sh: 167, ft: 105, at: [196, 177] },
    b: { torso: -12, ua: 90, fa: 0, th: 169, sh: 169, ft: 105, at: [196, 177] },
    period: 3600,
  },
  SQUAT: {
    anchor: 'foot',
    implement: 'backbar',
    a: standing({ ua: 140, fa: -62 }),
    b: standing({ torso: -52, ua: 172, fa: -40, th: 12, sh: 116 }),
  },
  LEG_PRESS: {
    anchor: 'hip',
    implement: 'sled',
    props: [{ kind: 'incline', from: [104, 152], to: [56, 116] }],
    a: { torso: -146, ua: 60, fa: 10, th: -62, sh: 32, ft: -58, at: [104, 146] },
    b: { torso: -146, ua: 60, fa: 10, th: -34, sh: -34, ft: -124, at: [104, 146] },
  },
  LUNGE: {
    anchor: 'foot',
    a: { ...STAND, th: 82, sh: 96, fth: 100, fsh: 98, fft: 40, at: [150, FLOOR] },
    b: { ...STAND, th: 4, sh: 94, fth: 108, fsh: 174, fft: 90, at: [150, FLOOR] },
  },
  LEG_EXTENSION: {
    anchor: 'hip',
    implement: 'ankle-pad',
    props: [{ kind: 'seat', x: 74, y: 138, w: 46 }, { kind: 'incline', from: [80, 132], to: [70, 72] }],
    a: { torso: -98, ua: 96, fa: 20, th: 0, sh: 94, ft: 0, at: [104, 130] },
    b: { torso: -98, ua: 96, fa: 20, th: 0, sh: 4, ft: -86, at: [104, 130] },
  },
  LEG_CURL: {
    anchor: 'hip',
    prone: true,
    implement: 'ankle-pad',
    props: [BENCH],
    a: { torso: 180, ua: 96, fa: 30, th: 0, sh: 2, ft: 80, at: [124, 128] },
    b: { torso: 180, ua: 96, fa: 30, th: -6, sh: -112, ft: -30, at: [124, 128] },
  },
  HIP_THRUST: {
    anchor: 'foot',
    implement: 'hip',
    props: [{ kind: 'bench', x1: 50, x2: 96, y: 140 }],
    a: { torso: 205, ua: 20, fa: 0, th: -25, sh: 100, ft: 0, at: [176, FLOOR] },
    b: { torso: 182, ua: 14, fa: -4, th: 0, sh: 90, ft: 0, at: [176, FLOOR] },
  },
  KICKBACK: {
    anchor: 'hand',
    a: { torso: -20, ua: 90, fa: 90, th: 96, sh: 176, ft: 180, fth: 90, fsh: 180, fft: 180, at: [166, FLOOR] },
    b: { torso: -20, ua: 90, fa: 90, th: 186, sh: -88, ft: -150, fth: 90, fsh: 180, fft: 180, at: [166, FLOOR] },
  },
  ABDUCTION: {
    anchor: 'hip',
    view: 'front',
    props: [{ kind: 'seat', x: 92, y: 132, w: 56 }],
    a: { torso: -90, ua: 100, fa: 70, th: 84, sh: 90, ft: 0, at: [120, 126] },
    b: { torso: -90, ua: 100, fa: 70, th: 52, sh: 90, ft: 0, at: [120, 126] },
  },
  CALF_RAISE: {
    anchor: 'toe',
    props: [{ kind: 'step', x: 112, y: FLOOR, w: 32 }],
    a: standing({ ft: -14 }, 136),
    b: standing({ ft: 38 }, 136),
    period: 1800,
  },
  SEATED_CALF: {
    anchor: 'toe',
    props: [{ kind: 'seat', x: 70, y: 112, w: 46 }, { kind: 'step', x: 128, y: FLOOR, w: 30 }],
    a: { torso: -88, ua: 70, fa: 0, th: 0, sh: 90, ft: -12, at: [150, FLOOR] },
    b: { torso: -88, ua: 70, fa: 0, th: 0, sh: 90, ft: 34, at: [150, FLOOR] },
    period: 1800,
  },
};

/** Movimentos que usam a mesma animacao. */
export const MOVEMENT_FALLBACK = 'CURL';
