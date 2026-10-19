import { getSearchRegex } from './search.js';
import type { ControlBlockInfo } from './control-block.js';
import type { SupervisionInfo } from './model.js';

/**
 * The supervisions of a list that match a search expression.
 * @param list - the rows to filter.
 * @param expression - what the user typed.
 * @returns the matching rows, in their original order.
 */
export function visibleSupervisions(
  list: SupervisionInfo[],
  expression: string
): SupervisionInfo[] {
  const regex = getSearchRegex(expression);
  return list.filter(info => regex.test(info.searchText));
}

/**
 * The control blocks of a list that match a search expression.
 * @param list - the rows to filter.
 * @param expression - what the user typed.
 * @returns the matching rows, in their original order.
 */
export function visibleControlBlocks(
  list: ControlBlockInfo[],
  expression: string
): ControlBlockInfo[] {
  const regex = getSearchRegex(expression);
  return list.filter(info => regex.test(info.searchText));
}
