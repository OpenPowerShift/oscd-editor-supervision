import { expect, fixture, html } from '@open-wc/testing';

import { ControlBlockList } from './control-block-list.js';
import { buildModel } from '../foundation/model.js';
import { loadFixture } from '../testing/fixtures.js';
import { ied } from '../testing/scl.js';
import { normalize } from '../testing/dom.js';

const tagName = 'control-block-list-spec';

if (customElements.get(tagName) === undefined) {
  customElements.define(tagName, ControlBlockList);
}

describe('control-block-list', () => {
  it('lists the assignable control blocks', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    const element = await fixture<ControlBlockList>(
      html`<control-block-list-spec
        .rows=${model.assignable}
        assignable
      ></control-block-list-spec>`
    );
    expect(element.shadowRoot!.textContent).to.contain(
      'GOOSE_Publisher > GOOSE2'
    );
    expect(element.shadowRoot!.textContent).to.contain('GOOSE2sDataSet');
  });

  it('shows the description of the control block in both lines', async () => {
    const doc = await loadFixture('supervisions.scd');
    doc.querySelector('GSEControl[name="GOOSE2"]')!.setAttribute('desc', 'Trip');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    const element = await fixture<ControlBlockList>(
      html`<control-block-list-spec .rows=${model.assignable} assignable>
      </control-block-list-spec>`
    );
    expect(element.shadowRoot!.textContent).to.contain(
      'GOOSE_Publisher > GOOSE2 - Trip'
    );
    expect(element.shadowRoot!.textContent).to.contain('GOOSE2sDataSet');
  });

  it('emits the chosen control block', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    const element = await fixture<ControlBlockList>(
      html`<control-block-list-spec .rows=${model.assignable} assignable>
      </control-block-list-spec>`
    );
    let chosen: Element | undefined;
    element.addEventListener('control-select', (event: Event) => {
      chosen = (event as CustomEvent<{ element: Element }>).detail.element;
    });
    (
      element.shadowRoot!.querySelector('oscd-list-item') as HTMLElement
    ).click();
    expect(chosen).to.equal(model.assignable[0].element);
  });

  it('asks for a supervision first when none is selected', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    const element = await fixture<ControlBlockList>(
      html`<control-block-list-spec .rows=${model.assignable}>
      </control-block-list-spec>`
    );
    expect(normalize(element.shadowRoot!.textContent)).to.contain(
      'Select a supervision first.'
    );
    expect(element.shadowRoot!.querySelector('oscd-list')).to.equal(null);
  });

  it('filters with the search field', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    const element = await fixture<ControlBlockList>(
      html`<control-block-list-spec .rows=${model.assignable} assignable>
      </control-block-list-spec>`
    );
    const field = element.shadowRoot!.querySelector<
      HTMLElement & { value: string }
    >('oscd-outlined-text-field')!;
    field.value = 'GOOSE_Publisher2';
    field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await element.updateComplete;

    const visible = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item')
    ).map(item => normalize(item.textContent));
    expect(visible.length).to.equal(1);
    expect(visible[0]).to.contain('GOOSE_Publisher2');
  });
});
