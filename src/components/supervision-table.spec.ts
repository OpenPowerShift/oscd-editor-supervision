import { expect, fixture, html } from '@open-wc/testing';

import { SupervisionTable } from './supervision-table.js';
import { buildModel } from '../foundation/model.js';
import { loadFixture } from '../testing/fixtures.js';
import { ied } from '../testing/scl.js';
import { normalize } from '../testing/dom.js';

const tagName = 'supervision-table-spec';

if (customElements.get(tagName) === undefined) {
  customElements.define(tagName, SupervisionTable);
}

describe('supervision-table', () => {
  it('names each supervision and its control block', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber1'), 'GOOSE');
    const element = await fixture<SupervisionTable>(
      html`<supervision-table-spec .rows=${model.used}></supervision-table-spec>`
    );

    expect(element.shadowRoot!.textContent).to.contain(
      'GOOSE_Supervision/LGOS1'
    );
    expect(element.shadowRoot!.textContent).to.contain(
      'GOOSE_Publisher > GOOSE2'
    );
  });

  it('emits the supervision of the chosen action', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber1'), 'GOOSE');
    const element = await fixture<SupervisionTable>(
      html`<supervision-table-spec .rows=${model.used}></supervision-table-spec>`
    );
    let disconnected: Element | undefined;
    let deleted: Element | undefined;
    element.addEventListener('supervision-disconnect', (event: Event) => {
      disconnected = (event as CustomEvent<{ element: Element }>).detail.element;
    });
    element.addEventListener('supervision-delete', (event: Event) => {
      deleted = (event as CustomEvent<{ element: Element }>).detail.element;
    });

    const rows = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item')
    );
    const second = rows[1];
    (
      second.querySelector(
        'oscd-icon-button[data-action="disconnect"]'
      ) as HTMLElement
    ).click();
    (
      second.querySelector(
        'oscd-icon-button[data-action="delete"]'
      ) as HTMLElement
    ).click();

    expect(disconnected).to.equal(model.used[1].element);
    expect(deleted).to.equal(model.used[1].element);
  });

  it('does not offer to delete the first supervision of its kind', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber1'), 'GOOSE');
    const element = await fixture<SupervisionTable>(
      html`<supervision-table-spec .rows=${model.used}></supervision-table-spec>`
    );
    const rows = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item')
    );
    const deleteButton = (row: HTMLElement): HTMLButtonElement =>
      row.querySelector(
        'oscd-icon-button[data-action="delete"]'
      ) as HTMLButtonElement;

    expect(
      (rows[0].querySelector('[slot="headline"]') as HTMLElement).textContent
    ).to.contain('LGOS1');
    expect(deleteButton(rows[0]).disabled).to.equal(true);
    expect(deleteButton(rows[1]).disabled).to.equal(false);
  });

  it('says so when nothing is supervised', async () => {
    const element = await fixture<SupervisionTable>(
      html`<supervision-table-spec></supervision-table-spec>`
    );
    expect(normalize(element.shadowRoot!.textContent)).to.contain(
      'No supervision logical node'
    );
  });
});
