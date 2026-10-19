/**
 * Extract the `name` attribute from an SCL element.
 * @param element - The element to read.
 * @returns the name, or undefined when it is absent or empty.
 */
export function getNameAttribute(element: Element): string | undefined {
  return element.getAttribute('name') || undefined;
}

/**
 * Extract the `desc` attribute from an SCL element.
 * @param element - The element to read.
 * @returns the description, or undefined when it is absent or empty.
 */
export function getDescriptionAttribute(element: Element): string | undefined {
  return element.getAttribute('desc') || undefined;
}

/** Sorts selected `ListItem`s to the top and disabled ones to the bottom. */
export function compareNames(a: Element | string, b: Element | string): number {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }

  if (typeof a === 'object' && typeof b === 'string') {
    return (a.getAttribute('name') ?? '').localeCompare(b);
  }

  if (typeof a === 'string' && typeof b === 'object') {
    return a.localeCompare(b.getAttribute('name')!);
  }

  if (typeof a === 'object' && typeof b === 'object') {
    return (a.getAttribute('name') ?? '').localeCompare(
      b.getAttribute('name') ?? ''
    );
  }

  return 0;
}

/** maximum value for `lnInst` attribute */
const maxLnInst = 99;
const lnInstRange = Array(maxLnInst)
  .fill(1)
  .map((_, i) => `${i + 1}`);

/**
 * @param lnElements - The LN elements to be scanned for `inst`
 * values already in use.
 * @returns first available inst value for LN or undefined if no inst is available
 */
export function minAvailableLogicalNodeInstance(
  lnElements: Element[]
): string | undefined {
  const lnInsts = new Set(lnElements.map(ln => ln.getAttribute('inst') || ''));
  return lnInstRange.find(lnInst => !lnInsts.has(lnInst));
}
