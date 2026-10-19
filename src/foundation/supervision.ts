import { isSrcRefEditable } from '@openscd/scl-lib/dist/tLN/supervision/foundation.js';

import { getDescriptionAttribute } from './foundation.js';
import {
  supervisionLnClass,
  supervisionRefName
} from './control-type.js';
import type { ControlType } from './control-type.js';

/**
 * Every supervision logical node of the given kind in an IED, in document
 * order.
 * @param ied - the IED.
 * @param controlType - GOOSE or sampled values.
 * @returns the `LGOS` or `LSVS` elements.
 */
export function supervisionLns(
  ied: Element,
  controlType: ControlType
): Element[] {
  const lnClass = supervisionLnClass[controlType];
  return Array.from(ied.querySelectorAll(`LN[lnClass="${lnClass}"]`));
}

/**
 * The control block reference held by a supervision logical node.
 * @param supervisionLn - an `LGOS` or `LSVS`.
 * @returns the reference, or null when it is empty.
 */
export function supervisionReference(
  supervisionLn: Element
): string | null {
  const refName =
    supervisionLn.getAttribute('lnClass') === 'LGOS'
      ? supervisionRefName.GOOSE
      : supervisionRefName.SMV;
  const value = supervisionLn
    .querySelector(`:scope > DOI[name="${refName}"] > DAI[name="setSrcRef"] > Val`)
    ?.textContent?.trim();
  return value ? value : null;
}

/**
 * The path of a supervision logical node, `LDInst/LNName`.
 * @param supervisionLn - an `LGOS` or `LSVS`.
 * @returns the path.
 */
export function supervisionPath(supervisionLn: Element): string {
  const logicalDevice = supervisionLn.closest('LDevice');
  const prefix = supervisionLn.getAttribute('prefix') ?? '';
  const lnClass = supervisionLn.getAttribute('lnClass') ?? '';
  const lnInst = supervisionLn.getAttribute('inst') ?? '';
  return `${logicalDevice?.getAttribute('inst') ?? ''}/${prefix}${lnClass}${lnInst}`;
}

/**
 * The description of a supervision logical node: its own `desc`, then the
 * `desc` of its `St` `DOI` or the `d` value inside it.
 * @param supervisionLn - an `LGOS` or `LSVS`.
 * @returns the description, or undefined when none is set.
 */
export function supervisionDescription(
  supervisionLn: Element
): string | undefined {
  const lnDescription = getDescriptionAttribute(supervisionLn);
  const st = supervisionLn.querySelector(':scope > DOI[name="St"]');
  const stDescription = st
    ? getDescriptionAttribute(st) ??
      st.querySelector(':scope > DAI[name="d"] > Val')?.textContent?.trim()
    : undefined;
  const descriptions = [lnDescription, stDescription].filter(
    description => !!description
  );
  return descriptions.length > 0 ? descriptions.join(' > ') : undefined;
}

/**
 * The first supervision logical node of the given kind in an IED. scl-lib
 * copies `lnType` and `prefix` from it when it creates a new one, so it must
 * not be deleted.
 * @param ied - the IED.
 * @param controlType - GOOSE or sampled values.
 * @returns the first node, or undefined when there is none.
 */
export function firstSupervisionLn(
  ied: Element,
  controlType: ControlType
): Element | undefined {
  return supervisionLns(ied, controlType)[0];
}

/**
 * Whether the `setSrcRef` of a supervision logical node may be changed, either
 * through its `DOI/DAI` or through its `LNodeType`.
 * @param supervisionLn - an `LGOS` or `LSVS`.
 * @returns whether it may be changed.
 */
export function isSupervisionEditable(supervisionLn: Element): boolean {
  // Deep import: scl-lib does not export `isSrcRefEditable` from its root.
  return isSrcRefEditable(supervisionLn);
}

/**
 * Whether the plugin may change supervisions of an IED: it needs a first
 * supervision logical node and its `setSrcRef` must be editable.
 * @param ied - the IED.
 * @param controlType - GOOSE or sampled values.
 * @returns whether changes are allowed.
 */
export function isModificationAllowed(
  ied: Element,
  controlType: ControlType
): boolean {
  const first = firstSupervisionLn(ied, controlType);
  return first !== undefined && isSupervisionEditable(first);
}

/**
 * The declared maximum number of supervision logical nodes of a kind. The
 * `Services > SupSubscription` element is optional; without it the IED declares
 * no supervision service.
 * @param ied - the IED.
 * @param controlType - GOOSE or sampled values.
 * @returns the maximum, or undefined when the IED does not declare one.
 */
export function maxSupervisions(
  ied: Element,
  controlType: ControlType
): number | undefined {
  const attribute = controlType === 'GOOSE' ? 'maxGo' : 'maxSv';
  const raw = ied
    .querySelector('Services > SupSubscription')
    ?.getAttribute(attribute);
  if (!raw) {
    return undefined;
  }
  const maximum = Number.parseInt(raw, 10);
  return Number.isNaN(maximum) ? undefined : maximum;
}

/**
 * Whether a new supervision logical node may be created: the IED must allow
 * changes and its declared maximum must not be reached.
 * @param ied - the IED.
 * @param controlType - GOOSE or sampled values.
 * @returns whether a new node may be created.
 */
export function canCreateSupervision(
  ied: Element,
  controlType: ControlType
): boolean {
  if (!isModificationAllowed(ied, controlType)) {
    return false;
  }
  const maximum = maxSupervisions(ied, controlType);
  return maximum !== undefined && supervisionLns(ied, controlType).length < maximum;
}

/**
 * Whether a supervision logical node may be deleted. The first one of its kind
 * in the IED cannot: scl-lib uses it as the template for new ones.
 * @param supervisionLn - an `LGOS` or `LSVS`.
 * @param ied - the IED.
 * @param controlType - GOOSE or sampled values.
 * @returns whether it may be deleted.
 */
export function canDeleteSupervision(
  supervisionLn: Element,
  ied: Element,
  controlType: ControlType
): boolean {
  return supervisionLn !== firstSupervisionLn(ied, controlType);
}
