import { expect } from '@open-wc/testing';

import {
  compareNames,
  sortControlBlocks,
  sortSupervisions
} from './sort.js';
import { buildModel } from './model.js';
import { loadFixture } from '../testing/fixtures.js';
import { ied } from '../testing/scl.js';

describe('compareNames', () => {
  it('sorts numbers as numbers', () => {
    const names = ['IED10', 'IED2', 'IED1'];
    names.sort(compareNames);
    expect(names).to.deep.equal(['IED1', 'IED2', 'IED10']);
  });

  it('sorts letters before digits', () => {
    expect(compareNames('LGOS 2', 'LGOS 10')).to.be.lessThan(0);
  });

  it('is zero for equal names', () => {
    expect(compareNames('GOOSE_Publisher', 'GOOSE_Publisher')).to.equal(0);
  });
});

describe('sortSupervisions', () => {
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = await loadFixture('supervisions.scd');
  });

  it('keeps the document order for the default order', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(sortSupervisions(model.available, 'document')).to.equal(
      model.available
    );
  });

  it('sorts by supervision description and puts rows without one last', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(
      sortSupervisions(model.available, 'supervision-description').map(
        row => row.path
      )
    ).to.deep.equal([
      'GOOSE_Supervision/LGOS2',
      'GOOSE_Supervision/LGOS3',
      'GOOSE_Supervision/LGOS1',
      'GOOSE_Supervision/LGOS3'
    ]);
  });

  it('sorts by control block name', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber1'), 'GOOSE');
    expect(
      sortSupervisions(model.used, 'control-name').map(
        row => row.controlBlock?.name
      )
    ).to.deep.equal([
      'GOOSE_Publisher > GOOSE2',
      'GOOSE_Publisher2 > GOOSE2'
    ]);
  });

  it('sorts by control block description', () => {
    doc.querySelector('GSEControl[name="GOOSE2"]')!.setAttribute('desc', 'B');
    doc.querySelectorAll('GSEControl[name="GOOSE2"]')[1].setAttribute('desc', 'A');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber1'), 'GOOSE');
    expect(
      sortSupervisions(model.used, 'control-description').map(
        row => row.controlBlock?.description
      )
    ).to.deep.equal(['A', 'B']);
  });
});

describe('sortControlBlocks', () => {
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = await loadFixture('supervisions.scd');
  });

  it('sorts by name', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(
      sortControlBlocks(model.assignable, 'control-name').map(row => row.name)
    ).to.deep.equal([
      'GOOSE_Publisher > GOOSE2',
      'GOOSE_Publisher2 > GOOSE2'
    ]);
  });

  it('leaves the order for the supervision orders', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(sortControlBlocks(model.assignable, 'document')).to.equal(
      model.assignable
    );
    expect(
      sortControlBlocks(model.assignable, 'supervision-description')
    ).to.equal(model.assignable);
  });

  it('sorts by description and puts rows without one last', () => {
    doc.querySelector('GSEControl[name="GOOSE2"]')!.setAttribute('desc', 'B');
    doc.querySelectorAll('GSEControl[name="GOOSE2"]')[1].setAttribute('desc', 'A');
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(
      sortControlBlocks(model.assignable, 'control-description').map(
        row => row.description
      )
    ).to.deep.equal(['A', 'B']);
  });
});
