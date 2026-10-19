import { controlBlockObjRef } from '@openscd/scl-lib';

import { getNameAttribute, getDescriptionAttribute } from './foundation.js';
import { compareNames } from './sort.js';
import { controlTag } from './control-type.js';
import type { ControlType } from './control-type.js';

/** Everything the lists and the actions need to know about a control block. */
export interface ControlBlockInfo {
  /** The `GSEControl` or `SampledValueControl` element. */
  element: Element;
  /** Its object reference, `IEDNameLDInst/LN.CBName`. */
  reference: string;
  /** `IEDName > CBName`, for the list title. */
  name: string;
  /** `LDInst/LNName`, for the list subtitle. */
  path: string;
  /** The cascade: LDevice, LN0 and control block descriptions. */
  description?: string;
  /** The `desc` of the control block itself, for the row heading. */
  ownDescription?: string;
  dataset?: string;
  id?: string;
  /** The text the search field looks at. */
  searchText: string;
}

/**
 * The SCL object reference of a control block. The reference of an `LGOS` is
 * `IEDNameLDInst/LNName.CBName`; scl-lib computes it.
 * @param controlBlock - the `GSEControl` or `SampledValueControl`.
 * @returns the reference, or null when a part of it is missing.
 */
export function controlBlockReference(
  controlBlock: Element | undefined
): string | null {
  if (!controlBlock) {
    return null;
  }
  return controlBlockObjRef(controlBlock);
}

/**
 * The `appID` of a GOOSE control or the `smvID` of a sampled value control.
 * @param controlBlock - the control block.
 * @returns the identifier, or undefined when the attribute is absent.
 */
export function controlBlockId(controlBlock: Element): string | undefined {
  const attribute =
    controlBlock.tagName === 'GSEControl' ? 'appID' : 'smvID';
  return controlBlock.getAttribute(attribute) || undefined;
}

/**
 * The path of the logical node that holds a control block, `LDInst/LNName`.
 * @param controlBlock - the control block.
 * @returns the path.
 */
export function controlBlockPath(controlBlock: Element): string {
  const logicalNode = controlBlock.closest('LN, LN0');
  const logicalDevice = controlBlock.closest('LDevice');
  const ldInst = logicalDevice?.getAttribute('inst') ?? '';
  const prefix = logicalNode?.getAttribute('prefix') ?? '';
  const lnClass = logicalNode?.getAttribute('lnClass') ?? '';
  const lnInst = logicalNode?.getAttribute('inst') ?? '';
  return `${ldInst}/${prefix}${lnClass}${lnInst}`;
}

/**
 * The name of a control block as `IEDName > CBName`.
 * @param controlBlock - the control block.
 * @returns the name.
 */
export function controlBlockName(controlBlock: Element): string {
  const iedName = getNameAttribute(controlBlock.closest('IED')!);
  const cbName = getNameAttribute(controlBlock);
  return [iedName, cbName].filter(name => !!name).join(' > ');
}

/**
 * The cascaded description of a control block, from the `desc` of its `LDevice`,
 * its `LN0` and the control block itself, joined with ` > `.
 * @param controlBlock - the control block.
 * @returns the description, or undefined when neither is set.
 */
export function controlBlockDescription(
  controlBlock: Element
): string | undefined {
  const logicalDevice = controlBlock.closest('LDevice');
  const ln0 = controlBlock.closest('LN0');
  const descriptions = [
    logicalDevice ? getDescriptionAttribute(logicalDevice) : undefined,
    ln0 ? getDescriptionAttribute(ln0) : undefined,
    getDescriptionAttribute(controlBlock)
  ].filter(description => !!description);
  return descriptions.length > 0 ? descriptions.join(' > ') : undefined;
}

/**
 * Build the list entry for a control block.
 * @param controlBlock - the control block.
 * @returns the entry, or null when the control block has no object reference.
 */
export function controlBlockInfo(
  controlBlock: Element
): ControlBlockInfo | null {
  const reference = controlBlockReference(controlBlock);
  if (!reference) {
    return null;
  }
  const dataset = controlBlock.getAttribute('datSet') || undefined;
  const id = controlBlockId(controlBlock);
  const description = controlBlockDescription(controlBlock);
  const ownDescription = getDescriptionAttribute(controlBlock);
  const info: ControlBlockInfo = {
    element: controlBlock,
    reference,
    name: controlBlockName(controlBlock),
    path: controlBlockPath(controlBlock),
    searchText: ''
  };
  if (description) {
    info.description = description;
  }
  if (ownDescription) {
    info.ownDescription = ownDescription;
  }
  if (dataset) {
    info.dataset = dataset;
  }
  if (id) {
    info.id = id;
  }
  info.searchText = [
    info.name,
    info.path,
    info.description,
    info.dataset,
    info.id
  ]
    .filter(part => !!part)
    .join(' ');
  return info;
}

/**
 * The control blocks of every IED except the one being edited, in IED and
 * control block name order. An IED supervises messages it receives from other
 * IEDs.
 * @param doc - the SCL document.
 * @param ied - the IED being edited.
 * @param controlType - GOOSE or sampled values.
 * @returns the control block elements.
 */
export function controlBlocksOfOtherIeds(
  doc: XMLDocument,
  ied: Element,
  controlType: ControlType
): Element[] {
  const iedName = getNameAttribute(ied);
  const tag = controlTag[controlType];
  return Array.from(doc.querySelectorAll(`LN0 > ${tag}`))
    .filter(controlBlock => getNameAttribute(controlBlock.closest('IED')!) !== iedName)
    .sort((a, b) => {
      const iedCompare = compareNames(
        getNameAttribute(a.closest('IED')!) ?? '',
        getNameAttribute(b.closest('IED')!) ?? ''
      );
      if (iedCompare !== 0) {
        return iedCompare;
      }
      return compareNames(
        getNameAttribute(a) ?? '',
        getNameAttribute(b) ?? ''
      );
    });
}
