import { css, html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { msg } from '@lit/localize';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';

import type { SupervisionInfo } from '../foundation/model.js';
import { visibleSupervisions } from '../foundation/rows.js';

/**
 * The supervision logical nodes that do not supervise a subscribed control
 * block: unassigned, with a reference to a control block that is not in the
 * file, or with a reference the IED does not subscribe to. Selecting one makes
 * it the target of the next control block choice; the "new" entry creates a
 * new supervision logical node.
 */
export class AvailableSupervisions extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon': OscdIcon,
    'oscd-icon-button': OscdIconButton,
    'oscd-list': OscdList,
    'oscd-list-item': OscdListItem,
    'oscd-outlined-text-field': OscdOutlinedTextField
  };

  @property({ attribute: false })
  rows: SupervisionInfo[] = [];

  /** `LGOS` or `LSVS`, for the label of the new entry. */
  @property()
  supervisionClass = 'LGOS';

  /** Whether a new supervision logical node may be created. */
  @property({ type: Boolean })
  canCreate = false;

  /** How many more supervision logical nodes the IED allows. */
  @property({ type: Number })
  available = 0;

  /** The selected supervision, or undefined for the "new" entry. */
  @property({ attribute: false })
  selected?: Element;

  @property({ type: Boolean })
  newSelected = false;

  @state()
  private search = '';

  private select(element: Element | undefined, isNew: boolean): void {
    this.dispatchEvent(
      new CustomEvent('supervision-select', {
        bubbles: true,
        composed: true,
        detail: { element, isNew }
      })
    );
  }

  private handleCreate(): void {
    this.dispatchEvent(
      new CustomEvent('supervision-create', { bubbles: true, composed: true })
    );
  }

  private renderStatus(row: SupervisionInfo): string {
    if (row.state === 'not-subscribed') {
      return msg('The IED does not subscribe to this control block.');
    }
    if (row.state === 'invalid') {
      return msg('The control block is not in this file.');
    }
    return msg('Not assigned.');
  }

  private renderRow(row: SupervisionInfo): TemplateResult {
    return html`<oscd-list-item
      type="button"
      class="row ${row.element === this.selected ? 'selected' : ''}"
      aria-selected=${row.element === this.selected ? 'true' : 'false'}
      @click=${() => this.select(row.element, false)}
    >
      <oscd-icon slot="start">monitor_heart</oscd-icon>
      <div slot="headline">${row.path}</div>
      <div slot="supporting-text">
        ${row.description ? html`${row.description} - ` : nothing}${this.renderStatus(
          row
        )}
      </div>
      <oscd-icon-button
        slot="end"
        data-action="delete"
        title=${msg('Delete this supervision')}
        .ariaLabel=${msg('Delete this supervision')}
        .disabled=${!row.deletable}
        @click=${(event: Event) => {
          event.stopPropagation();
          this.dispatchEvent(
            new CustomEvent('supervision-delete', {
              bubbles: true,
              composed: true,
              detail: { element: row.element }
            })
          );
        }}
      >
        <oscd-icon>delete</oscd-icon>
      </oscd-icon-button>
    </oscd-list-item>`;
  }

  render(): TemplateResult {
    const shown = visibleSupervisions(this.rows, this.search);
    const newLabel =
      this.supervisionClass === 'LGOS'
        ? msg('New LGOS supervision')
        : msg('New LSVS supervision');
    return html`<div class="filter">
      <oscd-outlined-text-field
        label=${msg('Search')}
        placeholder=${msg('Search')}
        .value=${this.search}
        @input=${(event: InputEvent) =>
          (this.search = (event.target as HTMLInputElement).value)}
      >
        <oscd-icon slot="leading-icon">search</oscd-icon>
      </oscd-outlined-text-field>
      <oscd-icon-button
        id="createNewLN"
        title=${msg('Create an empty supervision logical node')}
        .ariaLabel=${msg('Create an empty supervision logical node')}
        .disabled=${!this.canCreate}
        @click=${() => this.handleCreate()}
      >
        <oscd-icon>add</oscd-icon>
      </oscd-icon-button>
    </div>
    <oscd-list>
      ${shown.length === 0 && this.search
        ? html`<p class="empty">${msg('Nothing matches the search.')}</p>`
        : shown.map(row => this.renderRow(row))}
      <oscd-list-item
        type="button"
        class="new ${this.newSelected ? 'selected' : ''}"
        aria-selected=${this.newSelected ? 'true' : 'false'}
        .disabled=${!this.canCreate}
        @click=${() => this.select(undefined, true)}
      >
        <oscd-icon slot="start">heart_plus</oscd-icon>
        <div slot="headline">${newLabel}</div>
        <div slot="supporting-text">
          ${this.canCreate
            ? html`${this.available} ${msg('more allowed')}`
            : msg('No free supervision is allowed.')}
        </div>
      </oscd-list-item>
    </oscd-list>`;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .filter {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    oscd-outlined-text-field {
      flex: 1 1 auto;
    }

    .selected {
      background-color: var(--md-sys-color-primary-container);
      --md-sys-color-on-surface: var(--md-sys-color-on-primary-container);
      --md-sys-color-on-surface-variant: var(--md-sys-color-on-primary-container);
    }

    .empty {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
    }
  `;
}
