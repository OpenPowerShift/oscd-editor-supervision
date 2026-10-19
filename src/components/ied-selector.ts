import { css, html, LitElement } from 'lit';
import type { TemplateResult } from 'lit';
import { msg } from '@lit/localize';
import { property, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
import { OscdSelectionList } from '@omicronenergy/oscd-ui/selection-list/OscdSelectionList.js';
import type { SelectItem } from '@omicronenergy/oscd-ui/selection-list/OscdSelectionList.js';

import { getNameAttribute, getDescriptionAttribute } from '../foundation/foundation.js';
import { compareNames } from '../foundation/sort.js';

/**
 * An outlined button which shows the selected IED and opens a dialog to select
 * another one. The button makes it clear that the IED is a control, not a
 * label, and it shows which IED is selected without a second heading.
 */
export class IedSelector extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-dialog': OscdDialog,
    'oscd-filled-button': OscdFilledButton,
    'oscd-icon': OscdIcon,
    'oscd-outlined-button': OscdOutlinedButton,
    'oscd-selection-list': OscdSelectionList
  };

  @property({ attribute: false })
  ieds: Element[] = [];

  @property({ attribute: false })
  selected?: Element;

  @query('oscd-dialog')
  private dialog!: HTMLElement & { show(): void; open: boolean };

  @query('oscd-selection-list')
  private list!: OscdSelectionList;

  private get items(): SelectItem[] {
    return [...this.ieds]
      .sort((a, b) =>
        compareNames(getNameAttribute(a) ?? '', getNameAttribute(b) ?? '')
      )
      .map((ied) => {
        const manufacturer = ied.getAttribute('manufacturer');
        const type = ied.getAttribute('type');
        const description = getDescriptionAttribute(ied);
        const item: SelectItem = {
          headline: getNameAttribute(ied) ?? '',
          attachedElement: ied,
          selected: ied === this.selected
        };
        const supporting = [type, description, manufacturer]
          .filter(part => !!part)
          .join(' - ');
        if (supporting) {
          item.supportingText = supporting;
        }
        return item;
      });
  }

  private open(): void {
    this.list.items = this.items;
    this.dialog.show();
  }

  private apply(): void {
    const chosen = this.list.items.find(item => item.selected);
    if (chosen?.attachedElement) {
      this.dispatchEvent(
        new CustomEvent('ied-select', {
          bubbles: true,
          composed: true,
          detail: { element: chosen.attachedElement }
        })
      );
    }
    this.dialog.open = false;
  }

  render(): TemplateResult {
    const name = this.selected
      ? getNameAttribute(this.selected) ?? ''
      : msg('Select IED');
    return html`<oscd-outlined-button
      id="iedButton"
      title=${msg('Select IED')}
      @click=${() => this.open()}
    >
      <oscd-icon slot="icon">developer_board</oscd-icon>
      <span class="ied-name">${name}</span>
      <oscd-icon class="chevron">expand_more</oscd-icon>
    </oscd-outlined-button>
    <oscd-dialog>
      <div slot="headline">${msg('Select IED')}</div>
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

    .chevron {
      --md-icon-size: 20px;
      margin-inline-start: 4px;
      margin-inline-end: -8px;
      vertical-align: middle;
    }

    oscd-selection-list {
      min-width: 18rem;
    }
  `;
}
