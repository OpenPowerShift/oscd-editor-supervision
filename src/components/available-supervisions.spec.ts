import { expect, fixture, html } from '@open-wc/testing';

import { AvailableSupervisions } from './available-supervisions.js';
import { buildModel } from '../foundation/model.js';
import { loadFixture } from '../testing/fixtures.js';
import { ied } from '../testing/scl.js';
import { normalize } from '../testing/dom.js';

const tagName = 'available-supervisions-spec';

if (customElements.get(tagName) === undefined) {
  customElements.define(tagName, AvailableSupervisions);
}

describe('available-supervisions', () => {
  it('lists the supervisions which supervise nothing subscribed', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    const element = await fixture<AvailableSupervisions>(
      html`<available-supervisions-spec
        .rows=${model.available}
        supervisionClass="LGOS"
        canCreate
        .available=${1}
      ></available-supervisions-spec>`
    );
    expect(element.shadowRoot!.textContent).to.contain(
      'GOOSE_Supervision/LGOS2'
    );
    expect(element.shadowRoot!.textContent).to.contain('New LGOS supervision');
    expect(element.shadowRoot!.textContent).to.contain('1 more allowed');
  });

  it('filters with the search field', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    const element = await fixture<AvailableSupervisions>(
      html`<available-supervisions-spec
        .rows=${model.available}
        canCreate
      ></available-supervisions-spec>`
    );
    const field = element.shadowRoot!.querySelector<
      HTMLElement & { value: string }
    >('oscd-outlined-text-field')!;
    field.value = 'Important3';
    field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await element.updateComplete;

    const visible = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item.row')
    ).map(item => normalize(item.textContent));
    expect(visible.length).to.equal(1);
    expect(visible[0]).to.contain('LGOS3');
  });

  it('emits the chosen supervision and the new-supervision choice', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    const element = await fixture<AvailableSupervisions>(
      html`<available-supervisions-spec
        .rows=${model.available}
        canCreate
      ></available-supervisions-spec>`
    );
    const events: Array<{ element?: Element; isNew: boolean }> = [];
    element.addEventListener('supervision-select', (event: Event) => {
      events.push(
        (event as CustomEvent<{ element?: Element; isNew: boolean }>).detail
      );
    });

    const rows = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item.row')
    );
    rows[0].click();
    (
      element.shadowRoot!.querySelector('oscd-list-item.new') as HTMLElement
    ).click();

    expect(events[0].element).to.equal(model.available[0].element);
    expect(events[0].isNew).to.equal(false);
    expect(events[1].element).to.equal(undefined);
    expect(events[1].isNew).to.equal(true);
  });

  it('emits a delete for a row and a create from the button', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber1'), 'GOOSE');
    const element = await fixture<AvailableSupervisions>(
      html`<available-supervisions-spec
        .rows=${model.available}
        canCreate
      ></available-supervisions-spec>`
    );
    let deleted: Element | undefined;
    let created = 0;
    element.addEventListener('supervision-delete', (event: Event) => {
      deleted = (event as CustomEvent<{ element: Element }>).detail.element;
    });
    element.addEventListener('supervision-create', () => {
      created += 1;
    });

    const row = element.shadowRoot!.querySelector<HTMLElement>(
      'oscd-list-item.row'
    )!;
    (
      row.querySelector(
        'oscd-icon-button[data-action="delete"]'
      ) as HTMLElement
    ).click();
    (
      element.shadowRoot!.querySelector('#createNewLN') as HTMLElement
    ).click();

    expect(deleted).to.equal(model.available[0].element);
    expect(created).to.equal(1);
  });

  it('does not offer a new supervision when none is allowed', async () => {
    const doc = await loadFixture('supervisions.scd');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber2'), 'GOOSE');
    const element = await fixture<AvailableSupervisions>(
      html`<available-supervisions-spec
        .rows=${model.available}
        ?canCreate=${false}
      ></available-supervisions-spec>`
    );
    const newItem = element.shadowRoot!.querySelector<HTMLElement>(
      'oscd-list-item.new'
    )!;
    expect((newItem as HTMLElement & { disabled: boolean }).disabled).to.equal(
      true
    );
    expect(
      (
        element.shadowRoot!.querySelector('#createNewLN') as HTMLElement & {
          disabled: boolean;
        }
      ).disabled
    ).to.equal(true);
  });
});
