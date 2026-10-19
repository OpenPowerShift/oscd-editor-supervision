import { css, html, LitElement } from 'lit';
import type { TemplateResult } from 'lit';
import { msg } from '@lit/localize';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';

import type { ControlBlockInfo } from '../foundation/control-block.js';
import { visibleControlBlocks } from '../foundation/rows.js';

/**
 * The control blocks the selected IED subscribes to but no supervision holds
 * yet. Choosing one assigns it to the selected supervision, or to a new one.
 */
export class ControlBlockList extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon': OscdIcon,
    'oscd-list': OscdList,
    'oscd-list-item': OscdListItem,
    'oscd-outlined-text-field': OscdOutlinedTextField
  };

  @property({ attribute: false })
  rows: ControlBlockInfo[] = [];

  /** Whether a supervision is selected to receive a control block. */
  @property({ type: Boolean })
  assignable = false;

  /** The SCL icon of the control block kind, `gooseIcon` or `smvIcon`. */
  @property()
  iconName = 'gooseIcon';

  @state()
  private search = '';

  private select(element: Element): void {
    this.dispatchEvent(
      new CustomEvent('control-select', {
        bubbles: true,
        composed: true,
        detail: { element }
      })
    );
  }

  private renderRow(row: ControlBlockInfo): TemplateResult {
    const supporting = [row.path, row.description, row.dataset, row.id]
      .filter(part => !!part)
      .join(' - ');
    const headline = `${row.name}${
      row.ownDescription ? ` - ${row.ownDescription}` : ''
    }`;
    return html`<oscd-list-item
      type="button"
      class="row"
      .disabled=${!this.assignable}
      @click=${() => this.select(row.element)}
    >
      <oscd-icon slot="start">${this.iconName}</oscd-icon>
      <div slot="headline">${headline}</div>
      <div slot="supporting-text">${supporting}</div>
    </oscd-list-item>`;
  }

  render(): TemplateResult {
    const shown = visibleControlBlocks(this.rows, this.search);
    return html`<div class="filter">
      <oscd-outlined-text-field
        label=${msg('Search')}
        placeholder=${msg('Search')}
        .value=${this.search}
        .disabled=${!this.assignable}
        @input=${(event: InputEvent) =>
          (this.search = (event.target as HTMLInputElement).value)}
      >
        <oscd-icon slot="leading-icon">search</oscd-icon>
      </oscd-outlined-text-field>
    </div>
    ${!this.assignable
      ? html`<p class="empty">${msg('Select a supervision first.')}</p>`
      : html`<oscd-list>
          ${shown.length === 0
            ? html`<p class="empty">
                ${this.search
                  ? msg('Nothing matches the search.')
                  : msg('No control block is available to supervise.')}
              </p>`
            : shown.map(row => this.renderRow(row))}
        </oscd-list>`}`;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    [slot='headline'] {
      font-weight: 500;
    }

    .filter {
      display: flex;
      margin-bottom: 8px;
    }

    oscd-outlined-text-field {
      flex: 1 1 auto;
    }

    .empty {
      margin: 0 0 8px 0;
      color: var(--md-sys-color-on-surface-variant);
    }
  `;
}
