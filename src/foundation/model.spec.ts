import { expect } from '@open-wc/testing';

import { buildModel } from './model.js';
import {
  subscribedControlBlockReferences,
  supervisedControlBlockReferences
} from './subscription.js';
import { loadFixture } from '../testing/fixtures.js';
import { ied } from '../testing/scl.js';

describe('buildModel', () => {
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = await loadFixture('supervisions.scd');
  });

  it('has no IED when none is selected', () => {
    const model = buildModel(doc, undefined, 'GOOSE');
    expect(model.ied).to.equal(undefined);
    expect(model.used).to.deep.equal([]);
    expect(model.controlBlocks).to.deep.equal([]);
  });

  it('splits the supervisions of a subscriber into used and available', () => {
    const model = buildModel(
      doc,
      ied(doc, 'GOOSE_Subscriber1'),
      'GOOSE'
    );
    expect(model.editable).to.equal(true);
    expect(model.max).to.equal(4);
    expect(model.instantiated).to.equal(3);
    expect(model.canCreate).to.equal(true);
    expect(model.used.map(row => row.path)).to.deep.equal([
      'GOOSE_Supervision/LGOS1',
      'GOOSE_Supervision/LGOS2'
    ]);
    expect(model.available.map(row => row.path)).to.deep.equal([
      'GOOSE_Supervision/LGOS3'
    ]);
    expect(model.available[0].state).to.equal('not-subscribed');
  });

  it('attaches the control block of a used supervision', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber1'), 'GOOSE');
    expect(model.used[0].controlBlock?.reference).to.equal(
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2'
    );
  });

  it('reports no assignable control blocks when every subscription is supervised', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber1'), 'GOOSE');
    expect(model.assignable).to.deep.equal([]);
  });

  it('offers the subscribed control blocks for a subscriber without supervisions', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(model.used).to.deep.equal([]);
    expect(model.available.length).to.equal(4);
    expect(model.assignable.map(row => row.reference)).to.deep.equal([
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2',
      'GOOSE_Publisher2QB2_Disconnector/LLN0.GOOSE2'
    ]);
  });

  it('marks a reference to a supervision with a missing control block as invalid', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber5');
    const model = buildModel(doc, subscriber, 'GOOSE');
    const invalid = model.available.find(
      row => row.state === 'not-subscribed' || row.state === 'invalid'
    );
    expect(invalid).to.not.equal(undefined);
  });

  it('does not allow creation at the declared maximum', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber2'), 'GOOSE');
    expect(model.max).to.equal(4);
    expect(model.instantiated).to.equal(4);
    expect(model.canCreate).to.equal(false);
  });

  it('does not allow creation without a declared supervision service', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber'), 'GOOSE');
    expect(model.max).to.equal(undefined);
    expect(model.canCreate).to.equal(false);
  });

  it('uses the below-Maximum bound of the sampled value service', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber2'), 'SMV');
    expect(model.max).to.equal(0);
    expect(model.canCreate).to.equal(false);
  });

  it('lists the control blocks of the other IEDs for every model', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber1'), 'SMV');
    expect(model.controlBlocks.length).to.be.greaterThan(0);
    expect(
      model.controlBlocks.every(
        info => info.element.tagName === 'SampledValueControl'
      )
    ).to.equal(true);
  });
});

describe('subscription sets', () => {
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = await loadFixture('supervisions.scd');
  });

  it('resolves the subscribed control blocks of a subscriber', () => {
    const subscribed = subscribedControlBlockReferences(
      ied(doc, 'GOOSE_Subscriber1'),
      'GOOSE'
    );
    expect([...subscribed].sort()).to.deep.equal([
      'GOOSE_Publisher2QB2_Disconnector/LLN0.GOOSE2',
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2'
    ]);
  });

  it('resolves the control blocks held by the supervisions', () => {
    const supervised = supervisedControlBlockReferences(
      ied(doc, 'GOOSE_Subscriber1'),
      'GOOSE'
    );
    expect([...supervised].sort()).to.deep.equal([
      'GOOSE_Publisher2QB2_Disconnector/LLN0.GOOSE2',
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE1',
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2'
    ]);
  });

  it('does not count an ExtRef that resolves to a report control', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber1');
    expect(
      subscribedControlBlockReferences(subscriber, 'GOOSE').size
    ).to.be.lessThan(subscriber.querySelectorAll('ExtRef').length);
  });
});
