import type { EditV2 } from '@openscd/oscd-api';
import {
  getReference,
  instantiateSubscriptionSupervision,
  lnInstGenerator,
  removeSupervision
} from '@openscd/scl-lib';
import { isSrcRefEditable } from '@openscd/scl-lib/dist/tLN/supervision/foundation.js';
import { createElement } from '@openscd/scl-lib/dist/foundation/utils.js';

import { controlBlockReference } from './control-block.js';
import {
  supervisionLnClass,
  supervisionRefName
} from './control-type.js';
import type { ControlType } from './control-type.js';
import {
  canCreateSupervision,
  canDeleteSupervision,
  firstSupervisionLn,
  supervisionLns,
  supervisionReference
} from './supervision.js';

/**
 * Point an existing supervision logical node at a control block. The edit
 * replaces the reference in one step whether the node already holds one or
 * needs its `DOI`, `DAI` or `Val` created.
 * @param ied - the IED that holds the supervision.
 * @param controlType - GOOSE or sampled values.
 * @param supervisionLn - the `LGOS` or `LSVS` to change.
 * @param controlBlock - the control block to point it at.
 * @returns the edit, or null when the change is not allowed.
 */
export function assignSupervisionEdit(
  ied: Element,
  controlType: ControlType,
  supervisionLn: Element,
  controlBlock: Element
): EditV2 | null {
  const reference = controlBlockReference(controlBlock);
  if (!reference) {
    return null;
  }
  if (!isSrcRefEditable(supervisionLn)) {
    return null;
  }
  const heldByAnother = supervisionLns(ied, controlType).some(
    other =>
      other !== supervisionLn && supervisionReference(other) === reference
  );
  if (heldByAnother) {
    return null;
  }
  const refName = supervisionRefName[controlType];
  const val = supervisionLn.querySelector(
    `:scope > DOI[name="${refName}"] > DAI[name="setSrcRef"] > Val`
  );
  if (val) {
    return { element: val, textContent: reference };
  }
  return instantiateSubscriptionSupervision(
    { subscriberIedOrLn: supervisionLn, sourceControlBlock: controlBlock },
    {
      newSupervisionLn: false,
      fixedLnInst: -1,
      checkEditableSrcRef: true,
      checkDuplicateSupervisions: true,
      checkMaxSupervisionLimits: false
    }
  );
}

/**
 * Create a new supervision logical node and point it at a control block in one
 * step.
 * @param ied - the IED that receives the supervision.
 * @param controlBlock - the control block to supervise.
 * @returns the edit, or null when the change is not allowed.
 */
export function createAndAssignSupervisionEdit(
  ied: Element,
  controlBlock: Element
): EditV2 | null {
  const controlType: ControlType =
    controlBlock.tagName === 'GSEControl' ? 'GOOSE' : 'SMV';
  if (!canCreateSupervision(ied, controlType)) {
    return null;
  }
  return instantiateSubscriptionSupervision(
    { subscriberIedOrLn: ied, sourceControlBlock: controlBlock },
    {
      newSupervisionLn: true,
      fixedLnInst: -1,
      checkEditableSrcRef: true,
      checkDuplicateSupervisions: true,
      checkMaxSupervisionLimits: true
    }
  );
}

/**
 * Empty the reference of a supervision logical node, so that it supervises
 * nothing but remains in the file.
 * @param supervisionLn - the `LGOS` or `LSVS` to disconnect.
 * @returns the edit, or null when the reference may not be changed.
 */
export function disconnectSupervisionEdit(
  supervisionLn: Element
): EditV2 | null {
  return removeSupervision(supervisionLn, {
    removeSupervisionLn: false,
    checkSubscription: false
  });
}

/**
 * Delete a supervision logical node. The first one of its kind in the IED
 * cannot be deleted: scl-lib uses it as the template for new ones.
 * @param ied - the IED that holds the supervision.
 * @param controlType - GOOSE or sampled values.
 * @param supervisionLn - the `LGOS` or `LSVS` to delete.
 * @returns the edit, or null when it may not be deleted.
 */
export function deleteSupervisionEdit(
  ied: Element,
  controlType: ControlType,
  supervisionLn: Element
): EditV2 | null {
  if (!canDeleteSupervision(supervisionLn, ied, controlType)) {
    return null;
  }
  return removeSupervision(supervisionLn, {
    removeSupervisionLn: true,
    checkSubscription: false
  });
}

/**
 * Create an empty supervision logical node, with no reference, next to the
 * existing ones. It takes `lnType`, `prefix` and a free `inst` from the first
 * supervision logical node of its kind.
 * @param ied - the IED that receives the supervision.
 * @param controlType - GOOSE or sampled values.
 * @returns the edit, or null when there is no template to copy from.
 */
export function createSupervisionLnEdit(
  ied: Element,
  controlType: ControlType
): EditV2 | null {
  if (!canCreateSupervision(ied, controlType)) {
    return null;
  }
  const template = firstSupervisionLn(ied, controlType);
  const parent = template?.parentElement;
  const lnType = template?.getAttribute('lnType');
  if (!template || !parent || !lnType) {
    return null;
  }
  const lnClass = supervisionLnClass[controlType];
  const inst = lnInstGenerator(parent, 'LN')(lnClass);
  if (!inst) {
    return null;
  }
  const doc = template.ownerDocument as XMLDocument;
  const attributes: Record<string, string> = { lnClass, lnType, inst };
  const prefix = template.getAttribute('prefix') ?? '';
  if (prefix) {
    attributes.prefix = prefix;
  }
  const supervisionLn = createElement(doc, 'LN', attributes);
  supervisionLn.appendChild(
    createElement(doc, 'Private', { type: 'OpenSCD.create' })
  );
  // Insert after the last supervision logical node, not before the first one.
  const logicalNodes = Array.from(parent.children).filter(
    child => child.tagName === 'LN'
  );
  const last = logicalNodes[logicalNodes.length - 1];
  return {
    parent,
    node: supervisionLn,
    reference: last ? last.nextElementSibling : getReference(parent, 'LN')
  };
}
