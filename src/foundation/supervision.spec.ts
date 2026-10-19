import { expect } from '@open-wc/testing';

import {
  canDeleteSupervision,
  firstSupervisionLn,
  isModificationAllowed,
  isSupervisionEditable,
  maxSupervisions,
  supervisionDescription,
  supervisionLns,
  supervisionPath,
  supervisionReference
} from './supervision.js';
import { loadFixture } from '../testing/fixtures.js';
import { ied } from '../testing/scl.js';

describe('supervision', () => {
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = await loadFixture('supervisions.scd');
  });

  it('lists the supervision logical nodes in document order', () => {
    const nodes = supervisionLns(ied(doc, 'GOOSE_Subscriber1'), 'GOOSE');
    expect(nodes.map(node => node.getAttribute('inst'))).to.deep.equal([
      '1',
      '2',
      '3'
    ]);
  });

  it('lists the sampled value supervisions for sampled values', () => {
    const nodes = supervisionLns(ied(doc, 'GOOSE_Subscriber1'), 'SMV');
    expect(nodes.length).to.equal(3);
    expect(
      nodes.every(node => node.getAttribute('lnClass') === 'LSVS')
    ).to.equal(true);
  });

  it('reads and trims the control block reference', () => {
    const first = firstSupervisionLn(ied(doc, 'GOOSE_Subscriber1'), 'GOOSE')!;
    expect(supervisionReference(first)).to.equal(
      'GOOSE_PublisherQB2_Disconnector/LLN0.GOOSE2'
    );
  });

  it('returns null for a supervision without a reference', () => {
    const nodes = supervisionLns(ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(supervisionReference(nodes[0])).to.equal(null);
  });

  it('builds the path', () => {
    const first = firstSupervisionLn(ied(doc, 'GOOSE_Subscriber1'), 'GOOSE')!;
    expect(supervisionPath(first)).to.equal('GOOSE_Supervision/LGOS1');
  });

  it('joins the description of the node and its St data', () => {
    const nodes = supervisionLns(ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(supervisionDescription(nodes[1])).to.equal(
      'Important1 > Important2'
    );
    expect(supervisionDescription(nodes[2])).to.equal(
      'Important1 > Important3'
    );
    expect(supervisionDescription(nodes[0])).to.equal(undefined);
  });

  it('returns the first supervision in document order', () => {
    const first = firstSupervisionLn(ied(doc, 'GOOSE_Subscriber1'), 'GOOSE')!;
    expect(first.getAttribute('inst')).to.equal('1');
  });

  it('reads editability from the data type when the node has no DOI override', () => {
    expect(
      isSupervisionEditable(
        firstSupervisionLn(ied(doc, 'GOOSE_Subscriber1'), 'GOOSE')!
      )
    ).to.equal(true);
    expect(
      isSupervisionEditable(
        firstSupervisionLn(ied(doc, 'GOOSE_Subscriber3'), 'GOOSE')!
      )
    ).to.equal(false);
  });

  it('allows changes only when the first node exists and is editable', () => {
    expect(isModificationAllowed(ied(doc, 'GOOSE_Subscriber1'), 'GOOSE')).to.equal(
      true
    );
    expect(isModificationAllowed(ied(doc, 'GOOSE_Subscriber3'), 'GOOSE')).to.equal(
      false
    );
    expect(isModificationAllowed(ied(doc, 'GOOSE_Subscriber'), 'SMV')).to.equal(
      false
    );
  });

  it('reads the declared maximum for each kind', () => {
    expect(maxSupervisions(ied(doc, 'GOOSE_Subscriber1'), 'GOOSE')).to.equal(4);
    expect(maxSupervisions(ied(doc, 'GOOSE_Subscriber1'), 'SMV')).to.equal(3);
    expect(maxSupervisions(ied(doc, 'GOOSE_Subscriber2'), 'SMV')).to.equal(0);
    expect(maxSupervisions(ied(doc, 'GOOSE_Subscriber'), 'GOOSE')).to.equal(
      undefined
    );
  });

  it('never lets the first supervision of a kind be deleted', () => {
    const subscriber = ied(doc, 'GOOSE_Subscriber1');
    const nodes = supervisionLns(subscriber, 'GOOSE');
    expect(canDeleteSupervision(nodes[0], subscriber, 'GOOSE')).to.equal(false);
    expect(canDeleteSupervision(nodes[1], subscriber, 'GOOSE')).to.equal(true);
  });
});
