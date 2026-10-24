export const RANGES = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y"] as const;
export type Range = (typeof RANGES)[number];
export const isRange = (v: string | null): v is Range => !!v && (RANGES as readonly string[]).includes(v);

export type Bar = { t: string; c: number }; // t: "YYYY-MM-DD" (daily/weekly) or "YYYY-MM-DD HH:mm:ss" (intraday)
