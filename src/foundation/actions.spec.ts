import { expect } from '@open-wc/testing';

import {
  assignSupervisionEdit,
  createAndAssignSupervisionEdit,
  createSupervisionLnEdit,
  deleteSupervisionEdit,
  disconnectSupervisionEdit
} from './actions.js';
import { controlBlockInfo } from './control-block.js';
import { supervisionLns, supervisionReference } from './supervision.js';
import { loadFixture } from '../testing/fixtures.js';
import { applyEdit, ied } from '../testing/scl.js';

describe('actions', () => {
  let doc: XMLDocument;

  const gooseControl = (name: string): Element =>
    ied(doc, 'GOOSE_Publisher').querySelector(
      `LDevice > LN0 > GSEControl[name="${name}"]`
    )!;

  beforeEach(async () => {
    doc = await loadFixture('supervisions.scd');
  });

  it('writes the reference of an existing, empty supervision', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber4');
    const supervisionLn = supervisionLns(subscriber, 'GOOSE')[0];
    const edit = assignSupervisionEdit(
      subscriber,
      'GOOSE',
      supervisionLn,
      gooseControl('GOOSE2')
    );
    expect(edit === null).to.equal(false);
    applyEdit(edit!);
    expect(supervisionReference(supervisionLn)).to.equal(
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2'
    );
    expect(supervisionLns(subscriber, 'GOOSE').length).to.equal(4);
  });

  it('replaces the reference of a used supervision in one edit', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber1');
    const supervisionLn = supervisionLns(subscriber, 'GOOSE')[2];
    const edit = assignSupervisionEdit(
      subscriber,
      'GOOSE',
      supervisionLn,
      gooseControl('GOOSE1')
    );
    expect(Array.isArray(edit)).to.equal(false);
    applyEdit(edit!);
    expect(supervisionReference(supervisionLn)).to.equal(
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE1'
    );
  });

  it('refuses a reference another supervision already holds', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber4');
    const [first, second] = supervisionLns(subscriber, 'GOOSE');
    applyEdit(assignSupervisionEdit(subscriber, 'GOOSE', first, gooseControl('GOOSE2'))!);
    expect(
      assignSupervisionEdit(subscriber, 'GOOSE', second, gooseControl('GOOSE2'))
    ).to.equal(null);
  });

  it('refuses a control block without a reference', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber4');
    const controlBlock = gooseControl('GOOSE2').cloneNode(false) as Element;
    controlBlock.removeAttribute('name');
    expect(
      assignSupervisionEdit(
        subscriber,
        'GOOSE',
        supervisionLns(subscriber, 'GOOSE')[0],
        controlBlock
      )
    ).to.equal(null);
  });

  it('refuses to change a supervision whose source reference is not editable', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber3');
    expect(
      assignSupervisionEdit(
        subscriber,
        'GOOSE',
        supervisionLns(subscriber, 'GOOSE')[0],
        gooseControl('GOOSE2')
      )
    ).to.equal(null);
  });

  it('creates the missing DOI when a supervision has none', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber5');
    const supervisionLn = supervisionLns(subscriber, 'GOOSE')[0];
    supervisionLn
      .querySelector(':scope > DOI[name="GoCBRef"]')!
      .remove();
    const edit = assignSupervisionEdit(
      subscriber,
      'GOOSE',
      supervisionLn,
      gooseControl('GOOSE2')
    );
    expect(edit === null).to.equal(false);
    applyEdit(edit!);
    expect(supervisionReference(supervisionLn)).to.equal(
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2'
    );
  });

  it('creates a new supervision and its reference in one edit', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber4');
    const edit = createAndAssignSupervisionEdit(subscriber, gooseControl('GOOSE2'));
    expect(edit === null).to.equal(false);
    applyEdit(edit!);
    const nodes = supervisionLns(subscriber, 'GOOSE');
    expect(nodes.length).to.equal(5);
    expect(supervisionReference(nodes[4])).to.equal(
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2'
    );
  });

  it('refuses a new supervision at the declared maximum', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber2');
    expect(
      createAndAssignSupervisionEdit(subscriber, gooseControl('GOOSE1'))
    ).to.equal(null);
  });

  it('empties the reference when disconnecting', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber1');
    const supervisionLn = supervisionLns(subscriber, 'GOOSE')[0];
    applyEdit(disconnectSupervisionEdit(supervisionLn)!);
    expect(supervisionReference(supervisionLn)).to.equal(null);
    expect(supervisionLns(subscriber, 'GOOSE').length).to.equal(3);
  });

  it('deletes a supervision but not the first of its kind', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber1');
    const nodes = supervisionLns(subscriber, 'GOOSE');
    expect(deleteSupervisionEdit(subscriber, 'GOOSE', nodes[0])).to.equal(null);
    applyEdit(deleteSupervisionEdit(subscriber, 'GOOSE', nodes[1])!);
    expect(supervisionLns(subscriber, 'GOOSE').length).to.equal(2);
  });

  it('creates an empty supervision next to the existing ones', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber1');
    const edit = createSupervisionLnEdit(subscriber, 'GOOSE')!;
    expect(edit === null).to.equal(false);
    const node = (edit as { node: Element }).node;
    expect(node.tagName).to.equal('LN');
    expect(node.getAttribute('lnClass')).to.equal('LGOS');
    expect(node.getAttribute('lnType')).to.equal('Dummy.LGOS');
    expect(node.getAttribute('inst')).to.equal('4');
    expect(node.querySelector('Private[type="OpenSCD.create"]')).to.not.equal(
      null
    );
    applyEdit(edit);
    expect(supervisionLns(subscriber, 'GOOSE').length).to.equal(4);
    expect(node.parentElement?.tagName).to.equal('LDevice');
  });

  it('copies the prefix of the template supervision', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber1');
    const template = supervisionLns(subscriber, 'GOOSE')[0];
    template.setAttribute('prefix', 'S');
    const edit = createSupervisionLnEdit(subscriber, 'GOOSE')!;
    expect((edit as { node: Element }).node.getAttribute('prefix')).to.equal(
      'S'
    );
  });

  it('inserts the new supervision before elements that follow the LN sequence', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber1');
    const parent = supervisionLns(subscriber, 'GOOSE')[0].parentElement!;
    const accessControl = doc.createElementNS(
      'http://www.iec.ch/61850/2003/SCL',
      'AccessControl'
    );
    parent.appendChild(accessControl);
    const edit = createSupervisionLnEdit(subscriber, 'GOOSE')!;
    expect((edit as { reference: Node | null }).reference).to.equal(
      accessControl
    );
  });

  it('returns null without a template supervision to copy from', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber');
    if (subscriber.querySelector('LN[lnClass="LGOS"]')) {
      return;
    }
    expect(createSupervisionLnEdit(subscriber, 'GOOSE')).to.equal(null);
  });

  it('returns null for a new supervision without a template or a type', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber1');
    const template = supervisionLns(subscriber, 'GOOSE')[0];
    template.removeAttribute('lnType');
    expect(createSupervisionLnEdit(subscriber, 'GOOSE')).to.equal(null);
  });

  it('builds a control block list entry from a fixture control block', () => {
    const info = controlBlockInfo(gooseControl('GOOSE2'))!;
    expect(info.reference).to.equal(
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2'
    );
  });
});
