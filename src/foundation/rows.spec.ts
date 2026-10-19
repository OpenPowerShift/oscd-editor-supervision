import { expect } from '@open-wc/testing';

import { buildModel } from './model.js';
import { visibleControlBlocks, visibleSupervisions } from './rows.js';
import { loadFixture } from '../testing/fixtures.js';
import { ied } from '../testing/scl.js';

describe('rows', () => {
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = await loadFixture('supervisions.scd');
  });

  it('returns every row for an empty search', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(visibleSupervisions(model.available, '').length).to.equal(
      model.available.length
    );
    expect(visibleControlBlocks(model.controlBlocks, '').length).to.equal(
      model.controlBlocks.length
    );
  });

  it('matches a supervision on its path and its description', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(visibleSupervisions(model.available, 'Important2').length).to.equal(1);
    expect(visibleSupervisions(model.available, 'LGOS3').length).to.equal(2);
    expect(visibleSupervisions(model.available, 'Important1').length).to.equal(
      2
    );
  });

  it('matches a control block on its name and its dataset', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(visibleControlBlocks(model.controlBlocks, 'GOOSE1').length).to.equal(
      2
    );
    expect(
      visibleControlBlocks(model.controlBlocks, '"GOOSE_Publisher > GOOSE1"')
        .length
    ).to.equal(1);
  });

  it('returns no rows when nothing matches', () => {
    const model = buildModel(doc, ied(doc, 'GOOSE_Subscriber4'), 'GOOSE');
    expect(visibleControlBlocks(model.controlBlocks, 'nothing-matches')).to.deep.equal(
      []
    );
  });
});
