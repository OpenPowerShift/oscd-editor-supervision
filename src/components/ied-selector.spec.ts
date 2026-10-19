import { expect, fixture, html, waitUntil } from '@open-wc/testing';

import { IedSelector } from './ied-selector.js';
import { loadFixture } from '../testing/fixtures.js';
import { normalize } from '../testing/dom.js';

const tagName = 'ied-selector-spec';

if (customElements.get(tagName) === undefined) {
  customElements.define(tagName, IedSelector);
}

describe('ied-selector', () => {
  it('lists the IEDs, marks the current one and emits the chosen one', async () => {
    const doc = await loadFixture('supervisions.scd');
    const ieds = Array.from(doc.querySelectorAll(':root > IED'));
    const element = await fixture<IedSelector>(html`
      <ied-selector-spec .ieds=${ieds} .selected=${ieds[0]}></ied-selector-spec>
    `);
    let selected: Element | undefined;
    element.addEventListener('ied-select', (event: Event) => {
      selected = (event as CustomEvent<{ element: Element }>).detail.element;
    });

    const filter = element.shadowRoot!.querySelector('oscd-filter-button')!;
    (filter.shadowRoot!.querySelector('oscd-icon-button') as HTMLElement).click();
    await waitUntil(
      () =>
        (filter.shadowRoot!.querySelector('oscd-dialog') as HTMLElement & {
          open: boolean;
        }).open,
      'the dialog did not open'
    );

    const items = Array.from(
      filter.shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item')
    );
    const item = items.find(element =>
      normalize(element.textContent).includes('GOOSE_Subscriber4')
    )!;
    item.click();
    (filter.shadowRoot!.querySelector('oscd-filled-button') as HTMLElement).click();
    await waitUntil(
      () =>
        !(filter.shadowRoot!.querySelector('oscd-dialog') as HTMLElement & {
          open: boolean;
        }).open,
      'the dialog did not close'
    );

    expect(selected).to.equal(
      ieds.find(ied => ied.getAttribute('name') === 'GOOSE_Subscriber4')
    );
  });
});
