import { html, LitElement } from 'lit';
import type { TemplateResult } from 'lit';
import { msg } from '@lit/localize';
import { property } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdFilterButton } from '@omicronenergy/oscd-ui/filter-button/OscdFilterButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import type { FilterButtonDialogCloseEvent } from '@omicronenergy/oscd-ui/filter-button/OscdFilterButton.js';
import type { SelectItem } from '@omicronenergy/oscd-ui/selection-list/OscdSelectionList.js';

import { getNameAttribute, getDescriptionAttribute } from '../foundation/foundation.js';
import { compareNames } from '../foundation/sort.js';

/** A button which opens a dialog to select one IED. */
export class IedSelector extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-filter-button': OscdFilterButton,
    'oscd-icon': OscdIcon
  };

  @property({ attribute: false })
  ieds: Element[] = [];

  @property({ attribute: false })
  selected?: Element;

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

  private handleClose(event: FilterButtonDialogCloseEvent): void {
    const [element] = event.detail.selectedElements;
    if (element) {
      this.dispatchEvent(
        new CustomEvent('ied-select', {
          bubbles: true,
          composed: true,
          detail: { element }
        })
      );
    }
  }

  render(): TemplateResult {
    return html`<oscd-filter-button
      id="iedFilter"
      header=${msg('Select IED')}
      closeButtonLabel=${msg('Apply')}
      cancelButtonLabel=${msg('Cancel')}
      .items=${this.items}
      @filter-button-dialog-close=${(event: FilterButtonDialogCloseEvent) =>
        this.handleClose(event)}
    >
      <oscd-icon slot="icon">developer_board</oscd-icon>
    </oscd-filter-button>`;
  }
}
