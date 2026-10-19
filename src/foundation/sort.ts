/**
 * Sorts `name` attributes the way a person expects: letters before digits and
 * `IED2` before `IED10`.
 */
export const collator = new Intl.Collator('en', { numeric: true });

/**
 * Compare two SCL `name` attributes.
 * @param a - the first name.
 * @param b - the second name.
 * @returns a negative, zero or positive number.
 */
export function compareNames(a: string, b: string): number {
  return collator.compare(a, b);
}
