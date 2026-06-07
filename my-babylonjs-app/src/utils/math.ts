export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
