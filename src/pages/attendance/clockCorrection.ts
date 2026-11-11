import type { Id } from "@/types";

/** The manual clock in and out form: whose day, and the times as HH:mm (New York). */
export interface ClockCorrection {
  user_id: Id;
  user_name: string;
  date: string;
  clock_in: string;
  clock_out: string;
}

/** The form before anyone is picked. */
export const NO_CORRECTION: ClockCorrection = { user_id: "", user_name: "", date: "", clock_in: "", clock_out: "" };
