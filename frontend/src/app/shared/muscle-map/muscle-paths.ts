import { MuscleSlug } from '../../core/models/api.models';

/**
 * Mapa anatomico estilizado (viewBox 0 0 200 420). Cada musculo e desenhado apenas no lado esquerdo
 * (do observador) com comandos absolutos M/L/C/Q/Z; o lado direito e gerado por espelhamento em x = 100.
 */
export interface MusclePart { muscle: MuscleSlug; d: string; }

export const FRONT_PARTS: MusclePart[] = [
  // trapezio visto de frente
  { muscle: 'shoulders', d: 'M 91 66 C 85 70 78 73 70 76 C 78 79 86 79 93 75 Z' },
  // deltoide
  { muscle: 'shoulders', d: 'M 69 78 C 59 76 50 82 47 93 C 45 101 46 108 48 114 C 53 108 58 101 64 97 C 64 89 66 83 69 78 Z' },
  // peitoral
  { muscle: 'chest', d: 'M 98 82 L 98 118 C 91 124 80 124 72 118 C 66 113 64 106 66 98 C 68 89 75 83 85 81 C 90 80 95 80 98 82 Z' },
  // biceps
  { muscle: 'biceps', d: 'M 49 118 C 53 110 59 104 64 101 C 66 113 64 129 59 144 C 55 150 49 150 46 144 C 44 134 45 125 49 118 Z' },
  // antebraco
  { muscle: 'forearms', d: 'M 45 151 C 50 156 57 154 60 149 C 61 163 57 181 53 197 C 50 201 44 201 41 197 C 38 183 40 165 45 151 Z' },
  // abdomen (4 blocos + inferior)
  { muscle: 'abs', d: 'M 86 126 L 98 126 L 98 140 L 86 140 C 85 135 85 130 86 126 Z' },
  { muscle: 'abs', d: 'M 86 143 L 98 143 L 98 157 L 86 157 Z' },
  { muscle: 'abs', d: 'M 86 160 L 98 160 L 98 174 L 86 174 Z' },
  { muscle: 'abs', d: 'M 86 177 L 98 177 L 98 200 C 93 199 88 194 86 186 Z' },
  // obliquos
  { muscle: 'abs', d: 'M 72 123 C 76 126 80 127 83 127 L 83 186 C 80 190 76 193 71 195 C 73 178 73 150 72 123 Z' },
  // quadriceps
  { muscle: 'quads', d: 'M 69 205 C 76 207 85 212 92 219 C 96 234 97 262 94 290 C 89 296 81 297 75 294 C 69 278 64 250 64 229 C 64 218 66 210 69 205 Z' },
  // adutor (agrupado em quadriceps)
  { muscle: 'quads', d: 'M 95 218 C 98 221 99 226 99 233 L 99 256 C 98 262 97 266 96 268 C 97 252 97 234 95 218 Z' },
  // panturrilha / tibial visto de frente
  { muscle: 'calves', d: 'M 76 318 C 82 313 90 315 93 322 C 94 340 92 362 88 380 C 85 385 80 385 78 380 C 74 362 72 340 76 318 Z' },
];

export const BACK_PARTS: MusclePart[] = [
  // trapezio
  { muscle: 'back', d: 'M 99 60 C 94 67 83 73 70 77 C 80 83 90 96 99 122 Z' },
  // deltoide posterior
  { muscle: 'shoulders', d: 'M 68 79 C 58 77 50 83 47 94 C 45 102 46 108 48 114 C 53 108 58 101 64 98 C 64 90 66 84 68 79 Z' },
  // latissimo / romboides
  { muscle: 'back', d: 'M 71 98 C 80 101 92 112 98 126 L 98 160 C 91 166 84 176 78 187 C 72 168 66 141 66 119 C 66 109 68 102 71 98 Z' },
  // lombar
  { muscle: 'back', d: 'M 87 170 C 91 166 95 164 98 164 L 98 200 C 93 200 89 198 85 196 C 85 186 86 177 87 170 Z' },
  // triceps
  { muscle: 'triceps', d: 'M 49 117 C 54 109 59 103 64 100 C 66 113 64 129 59 145 C 55 151 49 151 46 145 C 44 134 45 125 49 117 Z' },
  // antebraco
  { muscle: 'forearms', d: 'M 45 152 C 50 157 57 155 60 150 C 61 164 57 182 53 197 C 50 201 44 201 41 197 C 38 183 40 166 45 152 Z' },
  // gluteos
  { muscle: 'glutes', d: 'M 98 200 C 89 198 76 199 68 207 C 64 219 66 233 74 241 C 84 247 93 245 98 239 Z' },
  // posterior de coxa
  { muscle: 'hamstrings', d: 'M 70 247 C 78 251 88 251 95 247 C 97 263 96 281 93 296 C 88 300 80 300 76 296 C 70 281 68 263 70 247 Z' },
  // panturrilha
  { muscle: 'calves', d: 'M 75 316 C 80 309 90 309 94 316 C 96 332 94 353 89 371 C 86 375 80 375 78 371 C 72 353 72 332 75 316 Z' },
];

/** Partes neutras (cabeca, maos, joelhos, pes) desenhadas como base da silhueta. */
export const NEUTRAL_FRONT: string[] = [
  'M 100 14 C 111 14 118 24 117 37 C 116 50 109 58 100 58 C 91 58 84 50 83 37 C 82 24 89 14 100 14 Z',
  'M 92 56 L 108 56 L 109 68 L 91 68 Z',
  'M 42 202 C 47 200 52 201 54 205 C 55 214 52 224 47 227 C 42 228 39 222 39 214 C 39 208 40 204 42 202 Z',
  'M 77 298 C 82 296 90 297 93 301 C 94 308 92 314 88 316 C 83 317 78 315 76 311 C 75 306 75 301 77 298 Z',
  'M 79 386 C 83 384 88 385 89 389 L 91 402 C 91 407 86 409 79 409 C 73 409 71 405 73 401 Z',
  'M 66 198 C 74 201 86 205 98 202 L 99 214 C 92 210 80 205 68 203 Z',
];

export const NEUTRAL_BACK: string[] = [
  'M 100 14 C 111 14 118 24 117 37 C 116 50 109 58 100 58 C 91 58 84 50 83 37 C 82 24 89 14 100 14 Z',
  'M 42 202 C 47 200 52 201 54 205 C 55 214 52 224 47 227 C 42 228 39 222 39 214 C 39 208 40 204 42 202 Z',
  'M 77 299 C 82 302 89 302 93 299 C 94 305 93 311 90 313 C 85 314 79 313 76 310 C 75 306 75 302 77 299 Z',
  'M 80 376 C 84 378 87 378 89 376 L 90 400 C 90 406 85 409 79 409 C 73 409 71 405 73 401 C 77 394 79 386 80 376 Z',
];

/** Espelha um path absoluto em torno de x = 100. */
export function mirror(d: string): string {
  let isX = true;
  return d.replace(/[A-Za-z]|-?\d*\.?\d+/g, (tok) => {
    if (/[A-Za-z]/.test(tok)) {
      isX = true;
      return tok;
    }
    const v = Number(tok);
    const out = isX ? 200 - v : v;
    isX = !isX;
    return String(Math.round(out * 100) / 100);
  });
}
