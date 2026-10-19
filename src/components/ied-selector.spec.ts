import { expect, fixture, html } from '@open-wc/testing';

import { IedSelector } from './ied-selector.js';
import { loadFixture } from '../testing/fixtures.js';
import { normalize } from '../testing/dom.js';

const tagName = 'ied-selector-spec';

if (customElements.get(tagName) === undefined) {
  customElements.define(tagName, IedSelector);
}

describe('ied-selector', () => {
  async function open(element: IedSelector): Promise<HTMLElement> {
    const dialog = element.shadowRoot!.querySelector<HTMLElement>(
      'oscd-dialog'
    )!;
    const opened = new Promise<void>((resolve) => {
      dialog.addEventListener('opened', () => resolve(), { once: true });
    });
    (element.shadowRoot!.querySelector('#iedButton') as HTMLElement).click();
    await opened;
    const list = element.shadowRoot!.querySelector(
      'oscd-selection-list'
    ) as HTMLElement & { updateComplete: Promise<unknown> };
    await list.updateComplete;
    return dialog;
  }

  function items(element: IedSelector): HTMLElement[] {
    return Array.from(
      element
        .shadowRoot!.querySelector('oscd-selection-list')!
        .shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item')
    );
  }

  it('shows the selected IED on a button, with a chevron', async () => {
    const doc = await loadFixture('supervisions.scd');
    const ieds = Array.from(doc.querySelectorAll(':root > IED'));
    const element = await fixture<IedSelector>(html`
      <ied-selector-spec .ieds=${ieds} .selected=${ieds[0]}></ied-selector-spec>
    `);
    const button = element.shadowRoot!.querySelector('#iedButton')!;
    expect(button.textContent).to.contain('SMV_Publisher');
    expect(button.textContent).to.contain('expand_more');
    expect(button.getAttribute('title')).to.equal('Select IED');
  });

  it('lists the IEDs in ascending name order', async () => {
    const doc = await loadFixture('supervisions.scd');
    const ieds = Array.from(doc.querySelectorAll(':root > IED')).reverse();
    const element = await fixture<IedSelector>(html`
      <ied-selector-spec .ieds=${ieds} .selected=${ieds[0]}></ied-selector-spec>
    `);
    await open(element);
    const names = items(element).map(
      item => normalize(item.textContent).split(' ')[0]
    );
    expect(names).to.deep.equal([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('asks for an IED when none is selected and emits nothing', async () => {
    const element = await fixture<IedSelector>(
      html`<ied-selector-spec></ied-selector-spec>`
    );
    expect(element.shadowRoot!.querySelector('#iedButton')!.textContent).to.contain(
      'Select IED'
    );
    let events = 0;
    element.addEventListener('ied-select', () => {
      events += 1;
    });
    const dialog = await open(element);
    const closed = new Promise<void>((resolve) => {
      dialog.addEventListener('closed', () => resolve(), { once: true });
    });
    (element.shadowRoot!.querySelector('oscd-filled-button') as HTMLElement).click();
    await closed;
    expect(events).to.equal(0);
  });

  it('emits the chosen IED and shows its name', async () => {
    const doc = await loadFixture('supervisions.scd');
    const ieds = Array.from(doc.querySelectorAll(':root > IED'));
    const element = await fixture<IedSelector>(html`
      <ied-selector-spec .ieds=${ieds} .selected=${ieds[0]}></ied-selector-spec>
    `);
    let selected: Element | undefined;
    element.addEventListener('ied-select', (event: Event) => {
      selected = (event as CustomEvent<{ element: Element }>).detail.element;
    });

    const dialog = await open(element);
    const item = items(element).find(element =>
      normalize(element.textContent).includes('GOOSE_Subscriber4')
    )!;
    item.click();
    const closed = new Promise<void>((resolve) => {
      dialog.addEventListener('closed', () => resolve(), { once: true });
    });
    (element.shadowRoot!.querySelector('oscd-filled-button') as HTMLElement).click();
    await closed;

    expect(selected).to.equal(
      ieds.find(ied => ied.getAttribute('name') === 'GOOSE_Subscriber4')
    );
  });
});
