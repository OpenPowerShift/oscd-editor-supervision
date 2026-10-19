import type { ControlBlockInfo } from './control-block.js';
import type { SupervisionInfo } from './model.js';

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

/** How the supervision rows and the control block rows are ordered. */
export type SupervisionSortOrder =
  | 'document'
  | 'supervision-description'
  | 'control-name'
  | 'control-description';

/** The sort orders in the order the sort menu shows them. */
export const supervisionSortOrders: SupervisionSortOrder[] = [
  'document',
  'supervision-description',
  'control-name',
  'control-description'
];

/**
 * Compare two optional descriptions. Rows without one sort last, so that the
 * named rows are read first.
 * @param a - the first description.
 * @param b - the second description.
 * @returns a negative, zero or positive number.
 */
function compareOptional(a: string | undefined, b: string | undefined): number {
  if (!a && !b) {
    return 0;
  }
  if (!a) {
    return 1;
  }
  if (!b) {
    return -1;
  }
  return collator.compare(a, b);
}

/**
 * Sort supervision rows for the chosen order. `document` keeps the order of
 * the document, which is the order the model built.
 * @param rows - the rows to sort.
 * @param order - the chosen order.
 * @returns a new array, or the same array for document order.
 */
export function sortSupervisions(
  rows: SupervisionInfo[],
  order: SupervisionSortOrder
): SupervisionInfo[] {
  if (order === 'document') {
    return rows;
  }
  const key = (row: SupervisionInfo): string | undefined => {
    if (order === 'supervision-description') {
      return row.description;
    }
    if (order === 'control-name') {
      return row.controlBlock?.name;
    }
    return row.controlBlock?.description;
  };
  return [...rows].sort((a, b) => compareOptional(key(a), key(b)));
}

/**
 * Sort control block rows for the chosen order. The supervision orders leave
 * this list in document order, because a control block has no supervision
 * description of its own.
 * @param rows - the rows to sort.
 * @param order - the chosen order.
 * @returns a new array, or the same array for document order.
 */
export function sortControlBlocks(
  rows: ControlBlockInfo[],
  order: SupervisionSortOrder
): ControlBlockInfo[] {
  if (order === 'control-name') {
    return [...rows].sort((a, b) => compareOptional(a.name, b.name));
  }
  if (order === 'control-description') {
    return [...rows].sort((a, b) =>
      compareOptional(a.description, b.description)
    );
  }
  return rows;
}
