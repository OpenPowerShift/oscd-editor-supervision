import { expect } from '@open-wc/testing';

import { getSearchRegex } from './search.js';

const matches = (search: string, text: string): boolean =>
  getSearchRegex(search).test(text);

describe('getSearchRegex', () => {
  it('matches everything for an empty or whitespace-only expression', () => {
    expect(matches('', 'anything')).to.equal(true);
    expect(matches('   ', 'anything')).to.equal(true);
  });

  it('is case insensitive', () => {
    expect(matches('goose', 'A GOOSE control')).to.equal(true);
    expect(matches('GOOSE', 'a goose control')).to.equal(true);
  });

  it('matches a substring', () => {
    expect(matches('ntr', 'control')).to.equal(true);
    expect(matches('xyz', 'control')).to.equal(false);
  });

  [
    ['both terms in order', 'one two', 'one two', true],
    ['both terms out of order', 'one two', 'two one', true],
    ['only the first term', 'one two', 'one', false],
    ['only the second term', 'one two', 'two', false],
    ['extra whitespace', '  one    two  ', 'two one', true]
  ].forEach(([name, search, text, expected]) => {
    it(`ANDs multiple terms: ${name}`, () => {
      expect(matches(search as string, text as string)).to.equal(expected);
    });
  });

  describe('wildcards', () => {
    it('matches any text with an asterisk', () => {
      expect(matches('a*c', 'ac')).to.equal(true);
      expect(matches('a*c', 'abbbc')).to.equal(true);
      expect(matches('a*c', 'ab')).to.equal(false);
    });

    it('matches one character with a question mark', () => {
      expect(matches('a?c', 'abc')).to.equal(true);
      expect(matches('a?c', 'ac')).to.equal(false);
    });
  });

  describe('quoting', () => {
    it('keeps a phrase together', () => {
      expect(matches('"foo bar"', 'a foo bar b')).to.equal(true);
      expect(matches('"foo bar"', 'bar foo')).to.equal(false);
      expect(matches("'foo bar'", 'a foo bar b')).to.equal(true);
    });

    it('combines a phrase with other terms', () => {
      expect(matches('"foo bar" baz', 'baz foo bar')).to.equal(true);
      expect(matches('"foo bar" baz', 'foo bar')).to.equal(false);
    });

    it('does not merge a bare term with a following phrase', () => {
      expect(matches('a"c d"', 'a c d')).to.equal(true);
      expect(matches('a"c d"', 'ac d')).to.equal(true);
      expect(matches('a"c d"', 'a c')).to.equal(false);
    });
  });

  describe('special characters', () => {
    ['(', ')', '[', ']', '{', '}', '+', '^', '$', '|', '\\', '.'].forEach(
      (char) => {
        it(`treats "${char}" literally`, () => {
          expect(() => getSearchRegex(`a${char}b`)).to.not.throw();
          expect(matches(`a${char}b`, `xa${char}bx`)).to.equal(true);
        });
      }
    );
  });
});
