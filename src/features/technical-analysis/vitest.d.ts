declare module 'vitest' {
  export const describe: (name: string, body: () => void) => void;
  export interface It {
    (name: string, body: () => void | Promise<void>): void;
    each<T extends readonly unknown[]>(
      values: T,
    ): (name: string, body: (value: T[number]) => void | Promise<void>) => void;
  }
  export const it: It;
  interface Expectation {
    toBe(value: unknown): void;
    toEqual(value: unknown): void;
    toBeGreaterThan(value: number): void;
    toBeNull(): void;
    toHaveLength(value: number): void;
    toHaveBeenCalledTimes(value: number): void;
    toBeInstanceOf(value: unknown): void;
    toMatchObject(value: unknown): void;
    rejects: Expectation;
  }
  export const expect: (value: unknown) => Expectation;
  export const vi: { spyOn<T extends object, K extends keyof T>(object: T, key: K): Expectation };
}
