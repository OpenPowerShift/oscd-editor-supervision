import { expect } from '@open-wc/testing';

import {
  controlBlockDescription,
  controlBlockId,
  controlBlockInfo,
  controlBlockName,
  controlBlockPath,
  controlBlockReference,
  controlBlocksOfOtherIeds
} from './control-block.js';
import { loadFixture } from '../testing/fixtures.js';
import { ied } from '../testing/scl.js';

describe('control-block', () => {
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = await loadFixture('supervisions.scd');
  });

  it('builds the object reference of a control block', () => {
    const controlBlock = doc.querySelector(
      'LN0 > GSEControl[name="GOOSE2"]'
    )!;
    expect(controlBlockReference(controlBlock)).to.equal(
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2'
    );
  });

  it('returns null when the control block or a part of its reference is missing', () => {
    expect(controlBlockReference(undefined)).to.equal(null);
    const controlBlock = doc.querySelector('LN0 > GSEControl')!;
    const withoutName = controlBlock.cloneNode(false) as Element;
    withoutName.removeAttribute('name');
    expect(controlBlockReference(withoutName)).to.equal(null);
  });

  it('reads the appID of a GOOSE control and the smvID of a sampled value control', () => {
    expect(controlBlockId(doc.querySelector('GSEControl[name="GOOSE2"]')!)).to.equal(
      'GOOSE2'
    );
    expect(
      controlBlockId(
        doc.querySelector('SampledValueControl[name="voltageOnly"]')!
      )
    ).to.equal('smv2');
  });

  it('returns undefined for a control block without an id', () => {
    const controlBlock = doc.querySelector('GSEControl[name="GOOSE2"]')!;
    const withoutId = controlBlock.cloneNode(false) as Element;
    withoutId.removeAttribute('appID');
    expect(controlBlockId(withoutId)).to.equal(undefined);
  });

  it('builds the path and the name', () => {
    const controlBlock = doc.querySelector('GSEControl[name="GOOSE2"]')!;
    expect(controlBlockPath(controlBlock)).to.equal('QB2_Disconnector/LLN0');
    expect(controlBlockName(controlBlock)).to.equal(
      'GOOSE_Publisher > GOOSE2'
    );
  });

  it('joins the descriptions of the control block and its LN0', () => {
    const controlBlock = doc.querySelector('GSEControl[name="GOOSE2"]')!;
    controlBlock.setAttribute('desc', 'Trip');
    controlBlock.closest('LN0')!.setAttribute('desc', 'Disconnector');
    expect(controlBlockDescription(controlBlock)).to.equal(
      'Trip > Disconnector'
    );
  });

  it('has no description when neither is set', () => {
    const controlBlock = doc.querySelector('GSEControl[name="GOOSE2"]')!;
    controlBlock.removeAttribute('desc');
    controlBlock.closest('LN0')!.removeAttribute('desc');
    expect(controlBlockDescription(controlBlock)).to.equal(undefined);
  });

  it('builds a list entry with its search text', () => {
    const info = controlBlockInfo(
      doc.querySelector('GSEControl[name="GOOSE2"]')!
    )!;
    expect(info.name).to.equal('GOOSE_Publisher > GOOSE2');
    expect(info.dataset).to.equal('GOOSE2sDataSet');
    expect(info.id).to.equal('GOOSE2');
    expect(info.searchText).to.contain('GOOSE_Publisher > GOOSE2');
  });

  it('offers the control blocks of the other IEDs only', () => {
    const blocks = controlBlocksOfOtherIeds(
      doc,
      ied(doc, 'GOOSE_Subscriber1'),
      'GOOSE'
    );
    const names = blocks.map(block => controlBlockName(block));
    expect(names).to.include('GOOSE_Publisher > GOOSE2');
    expect(names).to.include('GOOSE_Publisher2 > GOOSE2');
    expect(names.some(name => name.startsWith('GOOSE_Subscriber1'))).to.equal(
      false
    );
  });

  it('lists the sampled value control blocks for sampled values', () => {
    const blocks = controlBlocksOfOtherIeds(
      doc,
      ied(doc, 'GOOSE_Subscriber1'),
      'SMV'
    );
    expect(blocks.length).to.be.greaterThan(0);
    expect(blocks.every(block => block.tagName === 'SampledValueControl')).to.equal(
      true
    );
  });
});
