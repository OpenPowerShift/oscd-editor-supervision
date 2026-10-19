import {
  controlBlockInfo,
  controlBlocksOfOtherIeds
} from './control-block.js';
import type { ControlBlockInfo } from './control-block.js';
import {
  canCreateSupervision,
  canDeleteSupervision,
  firstSupervisionLn,
  isModificationAllowed,
  isSupervisionEditable,
  maxSupervisions,
  supervisionDescription,
  supervisionLns,
  supervisionPath,
  supervisionReference
} from './supervision.js';
import {
  subscribedControlBlockReferences,
  supervisedControlBlockReferences
} from './subscription.js';
import type { ControlType } from './control-type.js';

/** How a supervision logical node relates to the subscriptions of its IED. */
export type SupervisionState =
  | 'assigned'
  | 'available'
  | 'invalid'
  | 'not-subscribed';

/** Everything a list row needs to know about one supervision logical node. */
export interface SupervisionInfo {
  element: Element;
  /** The control block reference it holds, or null when it holds none. */
  reference: string | null;
  path: string;
  description?: string;
  state: SupervisionState;
  /** The control block the reference resolves to, when there is one. */
  controlBlock?: ControlBlockInfo;
  editable: boolean;
  deletable: boolean;
  /** The text the search field looks at. */
  searchText: string;
}

/** The derived state of one IED and control block kind. */
export interface SupervisionModel {
  ied?: Element;
  controlType: ControlType;
  /** Whether the plugin may change supervisions of this IED at all. */
  editable: boolean;
  /** The declared maximum number of supervision logical nodes. */
  max?: number;
  instantiated: number;
  /** Whether a new supervision logical node may be created. */
  canCreate: boolean;
  /** Supervisions that supervise a subscribed control block. */
  used: SupervisionInfo[];
  /** Supervisions that do not: unassigned, invalid or not subscribed. */
  available: SupervisionInfo[];
  /** The control blocks of other IEDs. */
  controlBlocks: ControlBlockInfo[];
  /** The subscribed control blocks no supervision holds yet. */
  assignable: ControlBlockInfo[];
}

/**
 * Derive everything the plugin shows from one document and one IED. Build it
 * once per document version: it indexes the control blocks and the subscriptions
 * in a single pass, so a large file is not traversed for every row.
 * @param doc - the SCL document.
 * @param ied - the IED being edited, or undefined when none is selected.
 * @param controlType - GOOSE or sampled values.
 * @returns the model.
 */
export function buildModel(
  doc: XMLDocument,
  ied: Element | undefined,
  controlType: ControlType
): SupervisionModel {
  const model: SupervisionModel = {
    controlType,
    editable: false,
    instantiated: 0,
    canCreate: false,
    used: [],
    available: [],
    controlBlocks: [],
    assignable: []
  };
  if (!ied) {
    return model;
  }
  model.ied = ied;

  const subscribed = subscribedControlBlockReferences(ied, controlType);
  const supervised = supervisedControlBlockReferences(ied, controlType);

  const controlBlocks = controlBlocksOfOtherIeds(doc, ied, controlType)
    .map(controlBlock => controlBlockInfo(controlBlock))
    .filter((info): info is ControlBlockInfo => info !== null);
  const byReference = new Map(
    controlBlocks.map(info => [info.reference, info] as const)
  );
  model.controlBlocks = controlBlocks;
  model.assignable = controlBlocks.filter(
    info => subscribed.has(info.reference) && !supervised.has(info.reference)
  );

  const template = firstSupervisionLn(ied, controlType);
  model.editable = isModificationAllowed(ied, controlType);
  model.max = maxSupervisions(ied, controlType);

  const supervisions = supervisionLns(ied, controlType);
  model.instantiated = supervisions.length;
  model.canCreate = canCreateSupervision(ied, controlType);

  model.used = [];
  model.available = [];
  supervisions.forEach((supervisionLn) => {
    const reference = supervisionReference(supervisionLn);
    const controlBlock = reference ? byReference.get(reference) : undefined;
    let state: SupervisionState = 'available';
    if (reference) {
      if (!controlBlock) {
        state = 'invalid';
      } else if (subscribed.has(reference)) {
        state = 'assigned';
      } else {
        state = 'not-subscribed';
      }
    }
    const description = supervisionDescription(supervisionLn);
    const info: SupervisionInfo = {
      element: supervisionLn,
      reference,
      path: supervisionPath(supervisionLn),
      state,
      editable: isSupervisionEditable(supervisionLn),
      deletable:
        supervisionLn !== template &&
        canDeleteSupervision(supervisionLn, ied, controlType),
      searchText: ''
    };
    if (description) {
      info.description = description;
    }
    if (controlBlock) {
      info.controlBlock = controlBlock;
    }
    info.searchText = [info.path, info.description, info.reference]
      .filter(part => !!part)
      .join(' ');
    if (state === 'assigned') {
      model.used.push(info);
    } else {
      model.available.push(info);
    }
  });
  return model;
}
