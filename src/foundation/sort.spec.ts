import { expect } from '@open-wc/testing';

import { compareNames } from './sort.js';

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
