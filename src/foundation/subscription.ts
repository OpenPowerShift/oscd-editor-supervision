import { controlBlockObjRef, sourceControlBlock } from '@openscd/scl-lib';

import { controlTag } from './control-type.js';
import type { ControlType } from './control-type.js';
import { supervisionLns, supervisionReference } from './supervision.js';

/**
 * The control block references an IED subscribes to, resolved from its
 * `ExtRef` elements. The `serviceType` of an `ExtRef` is optional in IEC
 * 61850-6, so the control block it resolves to decides the kind, not the
 * `ExtRef` attributes.
 * @param ied - the IED.
 * @param controlType - GOOSE or sampled values.
 * @returns the references.
 */
export function subscribedControlBlockReferences(
  ied: Element,
  controlType: ControlType
): Set<string> {
  const tag = controlTag[controlType];
  const references = new Set<string>();
  Array.from(ied.getElementsByTagName('ExtRef')).forEach((extRef) => {
    const controlBlock = sourceControlBlock(extRef);
    if (!controlBlock || controlBlock.tagName !== tag) {
      return;
    }
    const reference = controlBlockObjRef(controlBlock);
    if (reference) {
      references.add(reference);
    }
  });
  return references;
}

/**
 * The control block references held by the supervision logical nodes of an IED.
 * @param ied - the IED.
 * @param controlType - GOOSE or sampled values.
 * @returns the references.
 */
export function supervisedControlBlockReferences(
  ied: Element,
  controlType: ControlType
): Set<string> {
  const references = new Set<string>();
  supervisionLns(ied, controlType).forEach((supervisionLn) => {
    const reference = supervisionReference(supervisionLn);
    if (reference) {
      references.add(reference);
    }
  });
  return references;
}
