import { css, html, LitElement } from 'lit';
import type { TemplateResult } from 'lit';
import { msg } from '@lit/localize';
import { property, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
import { OscdSelectionList } from '@omicronenergy/oscd-ui/selection-list/OscdSelectionList.js';
import type { SelectItem } from '@omicronenergy/oscd-ui/selection-list/OscdSelectionList.js';

import { supervisionSortOrders } from '../foundation/sort.js';
import type { SupervisionSortOrder } from '../foundation/sort.js';

/** The label of each sort order. */
const sortLabels: Record<SupervisionSortOrder, () => string> = {
  document: () => msg('Document order'),
  'supervision-description': () => msg('Supervision description'),
  'control-name': () => msg('Control block name'),
  'control-description': () => msg('Control block description')
};

/**
 * A button which opens a dialog to choose the order of the supervision rows.
 * The button shows in the primary colour when the order is not the document
 * order.
 */
export class SortButton extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-dialog': OscdDialog,
    'oscd-filled-button': OscdFilledButton,
    'oscd-icon': OscdIcon,
    'oscd-icon-button': OscdIconButton,
    'oscd-outlined-button': OscdOutlinedButton,
    'oscd-selection-list': OscdSelectionList
  };

  @property()
  order: SupervisionSortOrder = 'document';

  @query('oscd-dialog')
  private dialog!: HTMLElement & { show(): void; open: boolean };

  @query('oscd-selection-list')
  private list!: OscdSelectionList;

  private get items(): SelectItem[] {
    return supervisionSortOrders.map(order => ({
      headline: sortLabels[order](),
      selected: order === this.order
    }));
  }

  private open(): void {
    this.list.items = this.items;
    this.dialog.show();
  }

  private apply(): void {
    const chosen = this.list.items.find(item => item.selected);
    if (chosen) {
      const order = supervisionSortOrders.find(
        candidate => sortLabels[candidate]() === chosen.headline
      );
      if (order && order !== this.order) {
        this.dispatchEvent(
          new CustomEvent('sort-change', {
            bubbles: true,
            composed: true,
            detail: { order }
          })
        );
      }
    }
    this.dialog.open = false;
  }

  render(): TemplateResult {
    return html`<oscd-icon-button
      id="sortButton"
      class=${this.order === 'document' ? '' : 'off-nominal'}
      title=${msg('Sort')}
      .ariaLabel=${msg('Sort')}
      @click=${() => this.open()}
    >
      <oscd-icon>sort</oscd-icon>
    </oscd-icon-button>
    <oscd-dialog>
      <div slot="headline">${msg('Sort')}</div>
      <div slot="content">
        <oscd-selection-list
          .items=${this.items}
        ></oscd-selection-list>
      </div>
      <div slot="actions">
        <oscd-outlined-button @click=${() => (this.dialog.open = false)}>
          ${msg('Cancel')}
        </oscd-outlined-button>
        <oscd-filled-button @click=${() => this.apply()}>
          ${msg('Apply')}
        </oscd-filled-button>
      </div>
    </oscd-dialog>`;
  }

  static styles = css`
    :host {
      display: inline-flex;
    }

    /*
     * The standard icon button paints its icon from its own token, so the
     * colour is set there as well as on the icon itself.
     */
    .off-nominal {
      --md-icon-button-icon-color: var(--md-sys-color-primary);
      --md-icon-button-hover-icon-color: var(--md-sys-color-primary);
      --md-icon-button-focus-icon-color: var(--md-sys-color-primary);
      --md-icon-button-pressed-icon-color: var(--md-sys-color-primary);
    }

    .off-nominal oscd-icon {
      color: var(--md-sys-color-primary);
    }

    oscd-selection-list {
      min-width: 18rem;
    }
  `;
}
