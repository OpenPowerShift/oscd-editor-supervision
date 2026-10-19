import { expect } from '@open-wc/testing';

import { getDescriptionAttribute, getNameAttribute } from './foundation.js';

describe('foundation', () => {
  let element: Element;

  beforeEach(() => {
    element = document.createElementNS(
      'http://www.iec.ch/61850/2003/SCL',
      'IED'
    );
  });

  it('reads a name', () => {
    element.setAttribute('name', 'IED1');
    expect(getNameAttribute(element)).to.equal('IED1');
  });

  it('treats an absent or empty name as undefined', () => {
    expect(getNameAttribute(element)).to.equal(undefined);
    element.setAttribute('name', '');
    expect(getNameAttribute(element)).to.equal(undefined);
  });

  it('reads a description', () => {
    element.setAttribute('desc', 'A device');
    expect(getDescriptionAttribute(element)).to.equal('A device');
  });

  it('treats an absent or empty description as undefined', () => {
    expect(getDescriptionAttribute(element)).to.equal(undefined);
    element.setAttribute('desc', '');
    expect(getDescriptionAttribute(element)).to.equal(undefined);
  });
});
