import {
  isComplexEditV2,
  isInsert,
  isRemove,
  isSetAttributes,
  isSetTextContent
} from '@openscd/oscd-api/utils.js';
import type { EditV2 } from '@openscd/oscd-api';

/**
 * Apply an edit to a document, the way a host applies the edits a plugin
 * dispatches. Used by specs to assert the resulting SCL.
 * @param edit - the edit or array of edits to apply.
 */
export function applyEdit(edit: EditV2): void {
  if (isComplexEditV2(edit)) {
    edit.forEach(one => applyEdit(one));
    return;
  }
  if (isInsert(edit)) {
    edit.parent.insertBefore(edit.node, edit.reference);
    return;
  }
  if (isSetTextContent(edit)) {
    edit.element.textContent = edit.textContent;
    return;
  }
  if (isSetAttributes(edit)) {
    Object.entries(edit.attributes ?? {}).forEach(([name, value]) => {
      if (value === null) {
        edit.element.removeAttribute(name);
      } else if (value !== undefined) {
        edit.element.setAttribute(name, value);
      }
    });
    return;
  }
  if (isRemove(edit)) {
    edit.node.parentNode?.removeChild(edit.node);
  }
}

/**
 * The IED with the given name.
 * @param doc - the SCL document.
 * @param name - the `name` attribute of the IED.
 * @returns the IED element.
 */
export function ied(doc: XMLDocument, name: string): Element {
  const element = doc.querySelector(`IED[name="${name}"]`);
  if (!element) {
    throw new Error(`No IED ${name} in the document`);
  }
  return element;
}

/**
 * The control block reference of a supervision logical node in a document.
 * @param doc - the SCL document.
 * @param name - the `name` attribute of the IED.
 * @param lnClass - `LGOS` or `LSVS`.
 * @param inst - the `inst` attribute.
 * @returns the text of the `Val`, or undefined when there is none.
 */
export function supervisionVal(
  doc: XMLDocument,
  name: string,
  lnClass: string,
  inst: string
): string | undefined {
  return (
    ied(doc, name)
      .querySelector(
        `LDevice > LN[lnClass="${lnClass}"][inst="${inst}"] > DOI > DAI > Val`
      )
      ?.textContent?.trim() || undefined
  );
}
