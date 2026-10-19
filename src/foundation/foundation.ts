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
