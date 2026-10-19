/** Text with whitespace collapsed, as it is read on screen. */
export const normalize = (text: string | null | undefined): string =>
  (text ?? '').replace(/\s+/g, ' ').trim();

/**
 * Finds all elements below `root`, including those in shadow roots.
 * @param root - where to look.
 * @param selector - CSS selector.
 * @returns the elements found.
 */
export function deepQueryAll(root: ParentNode, selector: string): HTMLElement[] {
  const found: HTMLElement[] = [];
  const visit = (node: ParentNode): void => {
    node.querySelectorAll<HTMLElement>(selector).forEach(element =>
      found.push(element)
    );
    node.querySelectorAll<HTMLElement>('*').forEach((element) => {
      if (element.shadowRoot) {
        visit(element.shadowRoot);
      }
    });
  };
  visit(root);
  return found;
}

/**
 * The first element below `root`, including those in shadow roots.
 * @param root - where to look.
 * @param selector - CSS selector.
 * @returns the element, or undefined when there is none.
 */
export function deepQuery(
  root: ParentNode,
  selector: string
): HTMLElement | undefined {
  return deepQueryAll(root, selector)[0];
}
