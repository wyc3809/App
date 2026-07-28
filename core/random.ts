/** Seeded RNG — PCG32. Never use Math.random() in simulation. */
export class SeededRng {
  private state: bigint;

  constructor(seed: number) {
    this.state = BigInt(seed >>> 0) + 0x853c49e6748fea9bn;
    this.next();
  }

  next(): number {
    const old = this.state;
    this.state = (old * 6364136223846793005n + 1n) & 0xffffffffffffffffn;
    const xorshifted = Number(((old >> 18n) ^ old) >> 27n) & 0xffffffff;
    const rot = Number(old >> 59n) & 31;
    return ((xorshifted >>> rot) | (xorshifted << (-rot & 31))) >>> 0;
  }

  /** [0, 1) */
  nextFloat(): number {
    return this.next() / 0x100000000;
  }

  /** [min, max] inclusive integers */
  nextInt(min: number, max: number): number {
    if (max < min) [min, max] = [max, min];
    const range = max - min + 1;
    return min + Math.floor(this.nextFloat() * range);
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  chance(probability: number): boolean {
    return this.nextFloat() < probability;
  }
}

let globalRng: SeededRng | null = null;

export function initRng(seed: number): SeededRng {
  globalRng = new SeededRng(seed);
  return globalRng;
}

export function getRng(): SeededRng {
  if (!globalRng) {
    globalRng = new SeededRng(Date.now() >>> 0);
  }
  return globalRng;
}
