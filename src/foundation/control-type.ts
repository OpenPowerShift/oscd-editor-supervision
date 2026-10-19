/** The two kinds of control block this plugin supervises. */
export type ControlType = 'GOOSE' | 'SMV';

/** The SCL tag of the control block for each kind. */
export const controlTag = {
  GOOSE: 'GSEControl',
  SMV: 'SampledValueControl'
} as const;

/** The SCL class of the supervision logical node for each kind. */
export const supervisionLnClass = {
  GOOSE: 'LGOS',
  SMV: 'LSVS'
} as const;

/** The `DOI`/`DAI` name holding the control block reference. */
export const supervisionRefName = {
  GOOSE: 'GoCBRef',
  SMV: 'SvCBRef'
} as const;

/** A human readable name of the control block kind, for messages. */
export const controlTypeName = {
  GOOSE: 'GOOSE',
  SMV: 'Sampled values'
} as const;
