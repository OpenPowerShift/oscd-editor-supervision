import { css, html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { msg } from '@lit/localize';
import { property } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';

import type { SupervisionInfo } from '../foundation/model.js';

/**
 * The supervisions that supervise a subscribed control block. Each row names
 * the supervision, the control block it supervises, and the two actions which
 * change it: disconnect (keep the node, empty its reference) and delete.
 */
export class SupervisionTable extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon': OscdIcon,
    'oscd-icon-button': OscdIconButton,
    'oscd-list': OscdList,
    'oscd-list-item': OscdListItem
  };

  @property({ attribute: false })
  rows: SupervisionInfo[] = [];

  private emit(name: string, element: Element): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        composed: true,
        detail: { element }
      })
    );
  }

  private handleDisconnect(element: Element): void {
    this.emit('supervision-disconnect', element);
  }

  private handleDelete(element: Element): void {
    this.emit('supervision-delete', element);
  }

  private renderRow(row: SupervisionInfo): TemplateResult {
    const controlName = row.controlBlock
      ? `${row.controlBlock.name}${
        row.controlBlock.ownDescription
          ? ` - ${row.controlBlock.ownDescription}`
          : ''
      }`
      : msg('No control block in this file');
    return html`<oscd-list-item class="row">
      <oscd-icon slot="start">monitor_heart</oscd-icon>
      <div slot="headline">${controlName}</div>
      <div slot="supporting-text">
        <span class="supervision">${row.path}</span>${row.description
          ? html` - ${row.description}`
          : nothing}
      </div>
      <div slot="end" class="actions">
        <oscd-icon-button
          data-action="disconnect"
          title=${msg('Disconnect this supervision')}
          .ariaLabel=${msg('Disconnect this supervision')}
          .disabled=${!row.editable}
          @click=${() => this.handleDisconnect(row.element)}
        >
          <oscd-icon>link_off</oscd-icon>
        </oscd-icon-button>
        <oscd-icon-button
          data-action="delete"
          title=${msg('Delete this supervision')}
          .ariaLabel=${msg('Delete this supervision')}
          .disabled=${!row.deletable || !row.editable}
          @click=${() => this.handleDelete(row.element)}
        >
          <oscd-icon>delete</oscd-icon>
        </oscd-icon-button>
      </div>
    </oscd-list-item>`;
  }

  render(): TemplateResult {
    if (this.rows.length === 0) {
      return html`<p class="empty">
        ${msg('No supervision logical node supervises a subscribed control block.')}
      </p>`;
    }
    return html`<oscd-list>
      ${this.rows.map(row => this.renderRow(row))}
    </oscd-list>`;
  }

  static styles = css`
    :host {
      display: block;
    }

    [slot='headline'] {
      font-weight: 500;
    }

    /* The supervision is the container; the control block is the message it
       watches. This keeps the supervision readable on the second line. */
    .supervision {
      font-weight: 500;
    }

    .actions {
      display: flex;
      align-items: center;
    }

    .empty {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
    }
  `;
}
