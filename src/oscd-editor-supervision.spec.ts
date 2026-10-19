import { expect } from '@open-wc/testing';

import OscdEditorSupervision from './oscd-editor-supervision.js';
import { loadFixture } from './testing/fixtures.js';

const tagName = 'oscd-editor-supervision-spec';

if (customElements.get(tagName) === undefined) {
  customElements.define(tagName, OscdEditorSupervision);
}

describe('oscd-editor-supervision', () => {
  it('renders the supervisions of the first IED', async () => {
    const doc = await loadFixture('supervisions.scd');
    const plugin = document.createElement(tagName) as OscdEditorSupervision;
    plugin.doc = doc;
    plugin.docName = 'supervisions.scd';
    document.body.append(plugin);

    await plugin.updateComplete;

    expect(plugin.doc).to.equal(doc);
    expect(plugin.shadowRoot).to.not.equal(null);

    plugin.remove();
  });
});
