import { expect, fixture, html } from '@open-wc/testing';

import { SortButton } from './sort-button.js';
import { normalize } from '../testing/dom.js';

const tagName = 'sort-button-spec';

if (customElements.get(tagName) === undefined) {
  customElements.define(tagName, SortButton);
}

describe('sort-button', () => {
  async function mount(order = 'document'): Promise<SortButton> {
    return fixture<SortButton>(
      html`<sort-button-spec .order=${order}></sort-button-spec>`
    );
  }

  async function open(element: SortButton): Promise<HTMLElement> {
    const dialog = element.shadowRoot!.querySelector<HTMLElement>(
      'oscd-dialog'
    )!;
    const opened = new Promise<void>((resolve) => {
      dialog.addEventListener('opened', () => resolve(), { once: true });
    });
    (element.shadowRoot!.querySelector('#sortButton') as HTMLElement).click();
    await opened;
    const list = element.shadowRoot!.querySelector(
      'oscd-selection-list'
    ) as HTMLElement & { updateComplete: Promise<unknown> };
    await list.updateComplete;
    return dialog;
  }

  function items(element: SortButton): HTMLElement[] {
    return Array.from(
      element
        .shadowRoot!.querySelector('oscd-selection-list')!
        .shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item')
    );
  }

  it('lists the four orders with the current one selected', async () => {
    const element = await mount('control-name');
    await open(element);
    const listItems = items(element);
    expect(listItems.map(item => normalize(item.textContent))).to.deep.equal([
      'Document order',
      'Supervision description',
      'Control block name',
      'Control block description'
    ]);
    const list = element.shadowRoot!.querySelector(
      'oscd-selection-list'
    ) as unknown as { items: Array<{ selected: boolean }> };
    expect(list.items[2].selected).to.equal(true);
  });

  it('emits the chosen order and closes', async () => {
    const element = await mount();
    const dialog = await open(element);
    let chosen: string | undefined;
    element.addEventListener('sort-change', (event: Event) => {
      chosen = (event as CustomEvent<{ order: string }>).detail.order;
    });
    const item = items(element).find(element =>
      normalize(element.textContent).includes('Control block name')
    )!;
    item.click();
    const closed = new Promise<void>((resolve) => {
      dialog.addEventListener('closed', () => resolve(), { once: true });
    });
    (
      element.shadowRoot!.querySelector('oscd-filled-button') as HTMLElement
    ).click();
    await closed;
    expect(chosen).to.equal('control-name');
  });

  it('does not emit when the order is unchanged', async () => {
    const element = await mount();
    const dialog = await open(element);
    let events = 0;
    element.addEventListener('sort-change', () => {
      events += 1;
    });
    const closed = new Promise<void>((resolve) => {
      dialog.addEventListener('closed', () => resolve(), { once: true });
    });
    (
      element.shadowRoot!.querySelector('oscd-filled-button') as HTMLElement
    ).click();
    await closed;
    expect(events).to.equal(0);
  });

  it('shows the primary colour when the order is not the document order', async () => {
    const element = await mount();
    element.style.setProperty('--md-sys-color-primary', '#123456');
    const button = element.shadowRoot!.querySelector('#sortButton')!;
    expect(button.classList.contains('off-nominal')).to.equal(false);
    element.order = 'control-name';
    await element.updateComplete;
    expect(button.classList.contains('off-nominal')).to.equal(true);
    expect(getComputedStyle(button.querySelector('oscd-icon')!).color).to.equal(
      'rgb(18, 52, 86)'
    );
  });
});
