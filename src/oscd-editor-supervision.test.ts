import { expect } from '@open-wc/testing';
import { setViewport } from '@web/test-runner-commands';
import { visualDiff } from '@web/test-runner-visual-regression';

import { PluginDriver } from './testing/driver.js';
import { mountPlugin } from './testing/plugin.js';
import type { MountedPlugin } from './testing/plugin.js';

/**
 * Screenshot tests for how the plugin looks. What the plugin does is checked by
 * the `*.spec.ts` files, so each screenshot here protects a distinct visual
 * state: the two kinds of supervision, the IED dialog, a selection, the empty
 * states, the read-only notice, the limit and the search.
 *
 * Baselines are owned by CI and must not be created or updated locally, see
 * `.github/workflows/update-visual-baselines.yml`.
 */

describe('oscd-editor-supervision screenshots', () => {
  let mounted: MountedPlugin;
  let driver: PluginDriver;

  before(async () => {
    await setViewport({ width: 1280, height: 800 });
  });

  afterEach(() => {
    mounted.unmount();
  });

  async function mount(fixture = 'supervisions.scd'): Promise<void> {
    await Promise.all([
      document.fonts.load('400 16px Roboto'),
      document.fonts.load('24px "Material Symbols Outlined"')
    ]);
    mounted = await mountPlugin({ fixture, height: 800 });
    driver = new PluginDriver(mounted);
    await document.fonts.ready;
  }

  const shot = async (name: string) => {
    (document.activeElement as HTMLElement | null)?.blur();
    await mounted.settle();
    return visualDiff(mounted.plugin, name);
  };

  it('lgos initially', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber1');
    await shot('lgos initially');
  });

  it('lsvs initially', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber1');
    await driver.setControlType('SMV');
    await shot('lsvs initially');
  });

  it('with the IED dialog open', async () => {
    await mount();
    await driver.openIedDialog();
    await shot('with the IED dialog open');
  });

  it('with the sort dialog open', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber1');
    await driver.openSort();
    await shot('with the sort dialog open');
  });

  it('with a non-default sort order', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber4');
    await driver.openSort();
    await driver.chooseSort('Supervision description');
    await shot('with a non-default sort order');
  });

  it('with a supervision selected', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber4');
    await driver.selectSupervision('GOOSE_Supervision/LGOS1');
    await shot('with a supervision selected');
  });

  it('without ieds', async () => {
    await mount('no-IEDs-present.scd');
    await shot('without ieds');
  });

  it('without supervisions', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber');
    await shot('without supervisions');
  });

  it('not editable', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber3');
    await shot('not editable');
  });

  it('at the maximum', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber2');
    await shot('at the maximum');
  });

  it('all supervisions assigned', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber1');
    await shot('all supervisions assigned');
  });

  it('with a missing control block', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber5');
    await shot('with a missing control block');
  });

  it('search without a match', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber4');
    await driver.search('available', 'nothing-matches');
    await shot('search without a match');
  });

  it('with a supervision selected keeps the selection visible', async () => {
    await mount();
    await driver.selectIed('GOOSE_Subscriber4');
    await driver.selectSupervision('GOOSE_Supervision/LGOS2');
    const selected = mounted.plugin.shadowRoot!.querySelector(
      'available-supervisions'
    )!.shadowRoot!.querySelector<HTMLElement>('oscd-list-item.selected');
    expect(selected).to.not.equal(null);
    const area = mounted.plugin.getBoundingClientRect();
    const box = selected!.getBoundingClientRect();
    expect(box.top >= area.top && box.bottom <= area.bottom).to.equal(true);
  });
});
