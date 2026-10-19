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
      ? row.controlBlock.name
      : msg('No control block in this file');
    const controlDescription = row.controlBlock?.description;
    const hasDescription = !!row.description || !!controlDescription;
    return html`<oscd-list-item class="row">
      <oscd-icon slot="start">monitor_heart</oscd-icon>
      <div slot="headline">
        <span class="supervision-name">${row.path}</span>
        <span class="source ${row.controlBlock ? '' : 'missing'}">
          <oscd-icon class="arrow">arrow_forward</oscd-icon>
          <span class="control-name">${controlName}</span>
        </span>
      </div>
      ${hasDescription
        ? html`<div slot="supporting-text">
            ${row.description
              ? html`<span class="supervision-description"
                  >${row.description}</span
                >`
              : nothing}
            ${controlDescription
              ? html`<span class="source">
                  <oscd-icon class="arrow">arrow_forward</oscd-icon>
                  <span class="control-description"
                    >${controlDescription}</span
                  >
                </span>`
              : nothing}
          </div>`
        : nothing}
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
          .disabled=${!row.deletable}
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
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    /*
     * The control block, and its description, are tinted from the text colour
     * so that they read as a separate thing from the supervision, in any row
     * state. They move to the next line whole when they do not fit.
     */
    .source {
      display: inline-flex;
      flex: 0 1 auto;
      flex-wrap: wrap;
      align-items: center;
      min-inline-size: 0;
      max-inline-size: 100%;
      box-sizing: border-box;
      padding: 0 6px 0 2px;
      border-radius: 4px;
      background-color: color-mix(in srgb, currentColor 8%, transparent);
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .source.missing {
      font-style: italic;
      color: var(--md-sys-color-on-surface-variant);
    }

    .arrow {
      --md-icon-size: 18px;
    }

    [slot='supporting-text'] {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
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
