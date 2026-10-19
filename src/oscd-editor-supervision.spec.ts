import { expect } from '@open-wc/testing';

import { PluginDriver } from './testing/driver.js';
import { loadFixture, mountPlugin } from './testing/plugin.js';
import type { MountedPlugin } from './testing/plugin.js';
import { supervisionReference, supervisionLns } from './foundation/supervision.js';
import type { EditV2 } from '@openscd/oscd-api';

describe('oscd-editor-supervision', () => {
  let mounted: MountedPlugin;
  let driver: PluginDriver;

  afterEach(() => {
    mounted.unmount();
  });

  async function mount(fixture = 'supervisions.scd'): Promise<void> {
    mounted = await mountPlugin({ fixture });
    driver = new PluginDriver(mounted);
  }

  it('fills the height of its host and does not overflow it', async () => {
    mounted = await mountPlugin({ height: 600 });
    await mounted.settle();
    expect(mounted.plugin.getBoundingClientRect().height).to.equal(600);
    expect(mounted.host.scrollHeight).to.equal(mounted.host.clientHeight);
  });

  it('selects the first IED of the selector by default', async () => {
    await mount();
    expect(driver.selectedIedName()).to.equal('GOOSE_Publisher');
    await driver.openIedDialog();
    const list = mounted.plugin
      .shadowRoot!.querySelector('ied-selector')!
      .shadowRoot!.querySelector('oscd-selection-list')!;
    const items = Array.from(
      list.shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item')
    );
    const checked = items.find(item =>
      item.querySelector('oscd-radio')?.hasAttribute('checked')
    );
    expect(checked).to.equal(items[0]);
  });

  it('renders the supervisions of the chosen IED', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber1');
    expect(driver.supervisionNames('used')).to.deep.equal([
      'GOOSE_Supervision/LGOS1',
      'GOOSE_Supervision/LGOS2'
    ]);
    expect(driver.controlNames('used')).to.deep.equal([
      'GOOSE_Publisher > GOOSE2',
      'GOOSE_Publisher2 > GOOSE2'
    ]);
    expect(driver.headlines('available')).to.deep.equal([
      'GOOSE_Supervision/LGOS3'
    ]);
  });

  it('assigns a control block to an available supervision in one edit', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber4');
    await driver.selectSupervision('GOOSE_Supervision/LGOS1');
    await driver.selectControlBlock('GOOSE_Publisher > GOOSE2');

    expect(mounted.edits.length).to.equal(1);
    const edit = mounted.edits[0] as EditV2 & { element?: Element };
    expect(edit.element).to.equal(
      supervisionLns(
        mounted.doc.querySelector('IED[name="GOOSE_Subscriber4"]')!,
        'GOOSE'
      )[0].querySelector('Val')
    );
    expect(
      supervisionReference(
        supervisionLns(
          mounted.doc.querySelector('IED[name="GOOSE_Subscriber4"]')!,
          'GOOSE'
        )[0]
      )
    ).to.equal('GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2');
    expect(driver.supervisionNames('used')).to.deep.equal([
      'GOOSE_Supervision/LGOS1'
    ]);
    expect(driver.controlNames('used')).to.deep.equal([
      'GOOSE_Publisher > GOOSE2'
    ]);
  });

  it('creates and assigns a supervision in one edit', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber4');
    await driver.selectNewSupervision();
    await driver.selectControlBlock('GOOSE_Publisher > GOOSE2');

    expect(mounted.edits.length).to.equal(1);
    const subscriber = mounted.doc.querySelector(
      'IED[name="GOOSE_Subscriber4"]'
    )!;
    expect(supervisionLns(subscriber, 'GOOSE').length).to.equal(5);
    expect(driver.supervisionNames('used')).to.deep.equal([
      'GOOSE_Supervision/LGOS4'
    ]);
  });

  it('disconnects a supervision and deletes another', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber1');
    await driver.disconnect('GOOSE_Supervision/LGOS1');
    expect(
      supervisionReference(
        supervisionLns(
          mounted.doc.querySelector('IED[name="GOOSE_Subscriber1"]')!,
          'GOOSE'
        )[0]
      )
    ).to.equal(null);

    await driver.deleteUsed('GOOSE_Supervision/LGOS2');
    expect(
      supervisionLns(
        mounted.doc.querySelector('IED[name="GOOSE_Subscriber1"]')!,
        'GOOSE'
      ).length
    ).to.equal(2);
  });

  it('does not offer to delete the first supervision of its kind', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber1');
    const items = Array.from(
      mounted.plugin
        .shadowRoot!.querySelector('supervision-table')!
        .shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item')
    );
    const deleteButton = (item: HTMLElement): HTMLButtonElement =>
      item.querySelector(
        'oscd-icon-button[data-action="delete"]'
      ) as HTMLButtonElement;
    expect(driver.supervisionNames('used')[0]).to.equal(
      'GOOSE_Supervision/LGOS1'
    );
    expect(deleteButton(items[0]).disabled).to.equal(true);
    expect(deleteButton(items[1]).disabled).to.equal(false);
  });

  it('rebuilds after an undo', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber4');
    await driver.selectSupervision('GOOSE_Supervision/LGOS1');
    await driver.selectControlBlock('GOOSE_Publisher > GOOSE2');
    expect(driver.headlines('used').length).to.equal(1);

    await mounted.undo();
    expect(
      supervisionReference(
        supervisionLns(
          mounted.doc.querySelector('IED[name="GOOSE_Subscriber4"]')!,
          'GOOSE'
        )[0]
      )
    ).to.equal(null);
    expect(driver.headlines('used').length).to.equal(0);
  });

  it('sorts the supervisions and marks a non-default order', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber4');
    await driver.openSort();
    await driver.chooseSort('Supervision description');

    expect(driver.sortIsOffNominal()).to.equal(true);
    expect(driver.headlines('available')).to.deep.equal([
      'GOOSE_Supervision/LGOS2',
      'GOOSE_Supervision/LGOS3',
      'GOOSE_Supervision/LGOS1',
      'GOOSE_Supervision/LGOS3'
    ]);

    await driver.openSort();
    await driver.chooseSort('Document order');
    expect(driver.sortIsOffNominal()).to.equal(false);
    expect(driver.headlines('available')).to.deep.equal([
      'GOOSE_Supervision/LGOS1',
      'GOOSE_Supervision/LGOS2',
      'GOOSE_Supervision/LGOS3',
      'GOOSE_Supervision/LGOS3'
    ]);
  });

  it('explains why it cannot change a supervision', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber3');
    expect(driver.notice()).to.contain('not editable');
  });

  it('says so when the document has no IEDs', async () => {
    await mount('no-IEDs-present.scd');
    expect(driver.emptyHeading()).to.contain('No IEDs in this file');
  });

  it('renders no unregistered custom element', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber1');
    expect(driver.notUpgraded()).to.deep.equal([]);
  });

  it('keeps the selection when the same document is edited', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber1');
    await driver.selectSupervision('GOOSE_Supervision/LGOS3');
    await mounted.applyEdit({
      element: mounted.doc.querySelector('Header')!,
      textContent: 'x'
    });
    expect(driver.headlines('available')).to.deep.equal([
      'GOOSE_Supervision/LGOS3'
    ]);
  });

  it('uses the document name the host gives it', async () => {
    mounted = await mountPlugin({ fixture: 'supervisions.scd' });
    expect(mounted.plugin.docName).to.equal('supervisions.scd');
  });

  it('starts without a document', async () => {
    mounted = await mountPlugin({ noDocument: true });
    expect(mounted.plugin.shadowRoot!.textContent?.trim()).to.equal('');
  });

  it('shows the sampled value supervisions after the switch', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber1');
    await driver.setControlType('SMV');
    expect(driver.headlines('used').length).to.equal(1);
    expect(driver.headlines('available').length).to.equal(2);
  });

  it('keeps the document reference when the host opens another file', async () => {
    await mount();
    const other = await loadFixture('no-IEDs-present.scd');
    await mounted.openDocument(other, 'other.scd');
    expect(mounted.plugin.doc).to.equal(other);
  });
});
