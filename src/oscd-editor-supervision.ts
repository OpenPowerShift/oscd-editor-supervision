import { css, html, LitElement, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { msg } from '@lit/localize';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdOutlinedSegmentedButton } from '@omicronenergy/oscd-ui/labs/segmentedbutton/OscdOutlinedSegmentedButton.js';
import { OscdOutlinedSegmentedButtonSet } from '@omicronenergy/oscd-ui/labs/segmentedbuttonset/OscdOutlinedSegmentedButtonSet.js';
import type { EditV2 } from '@openscd/oscd-api';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

import { oscdPaletteMd3 } from './theme.js';
import { AvailableSupervisions } from './components/available-supervisions.js';
import { ControlBlockList } from './components/control-block-list.js';
import { IedSelector } from './components/ied-selector.js';
import { SortButton } from './components/sort-button.js';
import { SupervisionTable } from './components/supervision-table.js';
import {
  assignSupervisionEdit,
  createAndAssignSupervisionEdit,
  createSupervisionLnEdit,
  deleteSupervisionEdit,
  disconnectSupervisionEdit
} from './foundation/actions.js';
import {
  controlTypeName,
  supervisionLnClass
} from './foundation/control-type.js';
import type { ControlType } from './foundation/control-type.js';
import { getDescriptionAttribute, getNameAttribute } from './foundation/foundation.js';
import { compareNames } from './foundation/sort.js';
import { buildModel } from './foundation/model.js';
import type { SupervisionModel } from './foundation/model.js';
import {
  sortControlBlocks,
  sortSupervisions
} from './foundation/sort.js';
import type { SupervisionSortOrder } from './foundation/sort.js';

const controlIconName = { GOOSE: 'gooseIcon', SMV: 'smvIcon' } as const;

/**
 * A plugin to create, assign and delete GOOSE (`LGOS`) and sampled value
 * (`LSVS`) supervision logical nodes of an IEC 61850 SCL file.
 *
 * The component keeps the selection and turns choices into edits. The lists are
 * components which show the derived model, and the model is built in
 * `foundation/` from the document.
 */
export default class OscdEditorSupervision extends ScopedElementsMixin(
  LitElement
) {
  static scopedElements = {
    'ied-selector': IedSelector,
    'supervision-table': SupervisionTable,
    'available-supervisions': AvailableSupervisions,
    'control-block-list': ControlBlockList,
    'sort-button': SortButton,
    'oscd-icon': OscdIcon,
    'oscd-outlined-segmented-button': OscdOutlinedSegmentedButton,
    'oscd-outlined-segmented-button-set': OscdOutlinedSegmentedButtonSet
  };

  @property({ attribute: false }) doc!: XMLDocument;

  @property() docName!: string;

  /** Changes whenever the document is edited. */
  @property({ attribute: false }) docVersion?: unknown;

  @property()
  controlType: ControlType = 'GOOSE';

  @state()
  private selectedIedName?: string;

  @state()
  private selectedSupervision?: Element;

  @state()
  private newSupervision = false;

  @state()
  private sortOrder: SupervisionSortOrder = 'document';

  @state()
  private model!: SupervisionModel;

  /**
   * The IEDs in the order the IED selector shows them: by name. The first one
   * is the default, so the first row of the selector is the selected one.
   */
  private get ieds(): Element[] {
    return this.doc
      ? Array.from(this.doc.querySelectorAll(':root > IED')).sort((a, b) =>
        compareNames(
          getNameAttribute(a) ?? '',
          getNameAttribute(b) ?? ''
        )
      )
      : [];
  }

  /** The selected IED, or the first one, or undefined when there is none. */
  private get ied(): Element | undefined {
    return (
      this.ieds.find(ied => getNameAttribute(ied) === this.selectedIedName) ??
      this.ieds[0]
    );
  }

  /** The selected supervision, when it is still available. */
  private get selection(): Element | undefined {
    return this.model.available.some(
      row => row.element === this.selectedSupervision
    )
      ? this.selectedSupervision
      : undefined;
  }

  private get newSelection(): boolean {
    return this.newSupervision && this.model.canCreate;
  }

  protected willUpdate(changed: PropertyValues): void {
    if (
      this.model === undefined ||
      changed.has('doc') ||
      changed.has('docVersion') ||
      changed.has('controlType') ||
      changed.has('selectedIedName')
    ) {
      this.model = buildModel(this.doc, this.ied, this.controlType);
    }
  }

  private dispatchEdit(edit: EditV2, title: string): void {
    this.dispatchEvent(newEditEventV2(edit, { title }));
  }

  private handleIedSelect(event: CustomEvent<{ element: Element }>): void {
    this.selectedIedName = getNameAttribute(event.detail.element);
    this.selectedSupervision = undefined;
    this.newSupervision = false;
  }

  private handleSupervisionSelect(
    event: CustomEvent<{ element?: Element; isNew: boolean }>
  ): void {
    this.selectedSupervision = event.detail.element;
    this.newSupervision = event.detail.isNew;
  }

  private handleControlSelect(event: CustomEvent<{ element: Element }>): void {
    const { element } = event.detail;
    const ied = this.model.ied;
    if (!ied) {
      return;
    }
    if (this.newSelection) {
      const edit = createAndAssignSupervisionEdit(ied, element);
      if (edit) {
        this.dispatchEdit(edit, msg('Assign supervision'));
      }
    } else if (this.selection) {
      const edit = assignSupervisionEdit(
        ied,
        this.controlType,
        this.selection,
        element
      );
      if (edit) {
        this.dispatchEdit(edit, msg('Assign supervision'));
      }
    }
    this.selectedSupervision = undefined;
    this.newSupervision = false;
  }

  private handleDisconnect(event: CustomEvent<{ element: Element }>): void {
    const edit = disconnectSupervisionEdit(event.detail.element);
    if (edit) {
      this.dispatchEdit(edit, msg('Disconnect supervision'));
    }
  }

  private handleDelete(event: CustomEvent<{ element: Element }>): void {
    const ied = this.model.ied;
    if (!ied) {
      return;
    }
    const edit = deleteSupervisionEdit(
      ied,
      this.controlType,
      event.detail.element
    );
    if (edit) {
      this.dispatchEdit(edit, msg('Delete supervision'));
    }
  }

  private handleCreate(): void {
    const ied = this.model.ied;
    if (!ied) {
      return;
    }
    const edit = createSupervisionLnEdit(ied, this.controlType);
    if (edit) {
      this.dispatchEdit(edit, msg('Create supervision'));
    }
  }

  private renderSwitches(): TemplateResult {
    const options: ControlType[] = ['GOOSE', 'SMV'];
    return html`<oscd-outlined-segmented-button-set id="controlSwitch">
      ${options.map(
        type => html`<oscd-outlined-segmented-button
          label=${controlTypeName[type]}
          no-checkmark
          data-control-type=${type}
          ?selected=${this.controlType === type}
          @click=${() => {
            this.controlType = type;
            this.selectedSupervision = undefined;
            this.newSupervision = false;
          }}
        >
          <oscd-icon slot="icon">${controlIconName[type]}</oscd-icon>
        </oscd-outlined-segmented-button>`
      )}
    </oscd-outlined-segmented-button-set>`;
  }

  private renderHeader(ied: Element): TemplateResult {
    const type = ied.getAttribute('type');
    const description = getDescriptionAttribute(ied);
    const used = this.model.used.length;
    const total = used + this.model.available.length;
    return html`<header>
      <h1 class="visually-hidden">${msg('Supervision')}</h1>
      <ied-selector
        .ieds=${this.ieds}
        .selected=${ied}
        @ied-select=${(event: CustomEvent<{ element: Element }>) =>
          this.handleIedSelect(event)}
      ></ied-selector>
      <p class="subtitle">
        ${type ?? msg('Unknown type')}${description
          ? html` - ${description}`
          : nothing}
      </p>
      ${this.renderSwitches()}
      <sort-button
        .order=${this.sortOrder}
        @sort-change=${(event: CustomEvent<{ order: SupervisionSortOrder }>) => {
          this.sortOrder = event.detail.order;
        }}
      ></sort-button>
      <span class="usage">
        ${used} ${msg('of')} ${total} ${msg('supervisions used')}
      </span>
    </header>`;
  }

  private renderNotice(): TemplateResult | typeof nothing {
    if (this.model.editable) {
      return nothing;
    }
    return html`<p class="notice" role="status">
      <oscd-icon>warning</oscd-icon>
      ${this.model.instantiated === 0
        ? msg(
          'This IED has no supervision logical node of this kind, so the plugin cannot create one.'
        )
        : msg(
          'The setSrcRef of the first supervision logical node is not editable, so the plugin cannot change supervisions.'
        )}
    </p>`;
  }

  protected render(): TemplateResult {
    if (!this.doc) {
      return html``;
    }
    const ied = this.ied;
    if (!ied) {
      return html`<div class="container">
        <h1>${msg('No IEDs in this file')}</h1>
      </div>`;
    }
    const lnClass = supervisionLnClass[this.controlType];
    const canCreate = this.model.canCreate;
    const used = sortSupervisions(this.model.used, this.sortOrder);
    const available = sortSupervisions(
      this.model.available,
      this.sortOrder
    );
    const assignable = sortControlBlocks(
      this.model.assignable,
      this.sortOrder
    );
    return html`<div class="container">
      ${this.renderHeader(ied)} ${this.renderNotice()}
      <div class="content">
        <section>
          <h2>
            ${this.controlType === 'GOOSE'
              ? msg('LGOS supervisions')
              : msg('LSVS supervisions')}
          </h2>
          <supervision-table
            .rows=${used}
            @supervision-disconnect=${(
              event: CustomEvent<{ element: Element }>
            ) => this.handleDisconnect(event)}
            @supervision-delete=${(event: CustomEvent<{ element: Element }>) =>
              this.handleDelete(event)}
          ></supervision-table>
        </section>
        <div class="assignment">
          <section>
            <h2>${msg('Available supervisions')}</h2>
            <available-supervisions
              .rows=${available}
              supervisionClass=${lnClass}
              ?canCreate=${canCreate}
              .available=${(this.model.max ?? 0) - this.model.instantiated}
              .selected=${this.selection}
              ?newSelected=${this.newSelection}
              @supervision-select=${(
                event: CustomEvent<{ element?: Element; isNew: boolean }>
              ) => this.handleSupervisionSelect(event)}
              @supervision-create=${() => this.handleCreate()}
              @supervision-delete=${(
                event: CustomEvent<{ element: Element }>
              ) => this.handleDelete(event)}
            ></available-supervisions>
          </section>
          <section>
            <h2>
              ${this.controlType === 'GOOSE'
                ? msg('GOOSE control blocks')
                : msg('Sampled value control blocks')}
            </h2>
            <control-block-list
              .rows=${assignable}
              iconName=${controlIconName[this.controlType]}
              ?assignable=${this.newSelection || this.selection !== undefined}
              @control-select=${(event: CustomEvent<{ element: Element }>) =>
                this.handleControlSelect(event)}
            ></control-block-list>
          </section>
        </div>
      </div>
    </div>`;
  }

  static styles = [
    oscdPaletteMd3,
    css`
      /*
       * Theming follows the OpenSCD theming guide: the internal palette comes
       * from the distro's --oscd-theme-* variables with defaults, and the
       * oscd-ui components are pointed at it.
       */
      :host {
        --oscd-primary: var(--oscd-theme-primary, #2aa198);
        --oscd-secondary: var(--oscd-theme-secondary, #6c71c4);
        --oscd-error: var(--oscd-theme-error, #dc322f);
        --oscd-warning: var(--oscd-theme-warning, #b58900);

        --oscd-base03: var(--oscd-theme-base03, #002b36);
        --oscd-base02: var(--oscd-theme-base02, #073642);
        --oscd-base01: var(--oscd-theme-base01, #586e75);
        --oscd-base00: var(--oscd-theme-base00, #657b83);
        --oscd-base0: var(--oscd-theme-base0, #839496);
        --oscd-base1: var(--oscd-theme-base1, #93a1a1);
        --oscd-base2: var(--oscd-theme-base2, #eee8d5);
        --oscd-base3: var(--oscd-theme-base3, #fdf6e3);

        --oscd-text-font: var(--oscd-theme-text-font, 'Roboto');
        --oscd-icon-font: var(
          --oscd-theme-icon-font,
          'Material Symbols Outlined'
        );

        --md-sys-color-warning: var(--oscd-warning);

        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        font-family: var(--oscd-text-font);
        color: var(--md-sys-color-on-surface);
      }

      .container {
        container-type: inline-size;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        min-height: 0;
      }

      header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }

      .subtitle,
      .usage {
        margin: 0;
        color: var(--md-sys-color-on-surface-variant);
      }

      .usage {
        margin-inline-start: auto;
      }

      .notice {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        padding: 8px 12px;
        background-color: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
      }

      .content {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: 16px;
        min-height: 0;
        overflow: auto;
        padding: 12px;
      }

      section {
        min-width: 0;
      }

      h2 {
        font-size: 1rem;
        font-weight: 500;
        margin: 0 0 8px 0;
      }

      .assignment {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 16px;
      }

      .empty {
        margin: 0;
        color: var(--md-sys-color-on-surface-variant);
      }

      @container (max-width: 900px) {
        .assignment {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `
  ];
}
