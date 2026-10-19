/**
 * A regular expression for the list search fields.
 *
 * The search is case-insensitive. A quoted phrase (`"a b"` or `'a b'`) matches
 * as one phrase; a space between terms means every term must match, in any
 * order. `*` matches any text and `?` matches one character.
 *
 * @param expression - what the user typed.
 * @returns a regular expression matching the search text.
 */
export function getSearchRegex(expression: string): RegExp {
  const terms = tokenize(expression);
  if (terms.length === 0) {
    return /.*/i;
  }
  const lookaheads = terms.map(term => `(?=.*${termPattern(term)})`);
  return new RegExp(`${lookaheads.join('')}.*`, 'i');
}

/**
 * Split the search text into terms. A quoted phrase is one term; any other run
 * of characters without whitespace or a quote is one term.
 * @param expression - what the user typed.
 * @returns the terms, without their quotes.
 */
function tokenize(expression: string): string[] {
  const terms: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|([^\s"']+)/g;
  let match: RegExpExecArray | null = pattern.exec(expression);
  while (match !== null) {
    const term = match[1] ?? match[2] ?? match[3];
    if (term) {
      terms.push(term);
    }
    match = pattern.exec(expression);
  }
  return terms;
}

/**
 * Turn one term into a regular expression fragment: escape regular expression
 * syntax, then apply the two wildcards.
 * @param term - one search term.
 * @returns the fragment.
 */
function termPattern(term: string): string {
  return term
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.{1}');
}
