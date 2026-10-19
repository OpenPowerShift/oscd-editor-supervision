import { waitUntil } from '@open-wc/testing';
import { XMLEditor } from '@openscd/oscd-editor';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import type { EditEventV2, EditV2 } from '@openscd/oscd-api';

import OscdEditorSupervision from '../oscd-editor-supervision.js';
import { loadFixture } from './fixtures.js';

export { loadFixture };

const tagName = 'oscd-editor-supervision-spec';

if (customElements.get(tagName) === undefined) {
  customElements.define(tagName, OscdEditorSupervision);
}

export type MountOptions = {
  /** File name within `test/fixtures`. */
  fixture?: string;
  /** An already parsed document, used instead of a fixture. */
  doc?: XMLDocument;
  /** Mount without a document, as before the host has opened a file. */
  noDocument?: boolean;
  /** How tall the host is, in pixels. The plugin fills it. */
  height?: number;
};

export type MountedPlugin = {
  plugin: OscdEditorSupervision;
  doc: XMLDocument;
  /** Every `oscd-edit-v2` edit dispatched by the plugin, in order. */
  edits: EditV2[];
  /** The undo/redo history, as the host keeps it. */
  editor: XMLEditor;
  /** The element the plugin was appended to, which is its host. */
  host: HTMLElement;
  /** Dispatches an edit as another plugin or menu would. */
  applyEdit: (edit: EditV2) => Promise<void>;
  /** Replaces the document, as the host does when another file is opened. */
  openDocument: (doc: XMLDocument, docName: string) => Promise<void>;
  /** Steps one edit back, as the host undo does. */
  undo: () => Promise<void>;
  /** Steps one edit forward again. */
  redo: () => Promise<void>;
  /** Waits for the plugin and its components to finish rendering. */
  settle: () => Promise<void>;
  /** Removes the plugin and its host from the page. */
  unmount: () => void;
};

/**
 * Mounts the plugin on its own, without the shell, and applies the edits it
 * dispatches to the document just as the host does: the document is changed and
 * `docVersion` increased before the plugin sees the edit "after".
 * @param options - fixture, document and height to mount with.
 * @returns the plugin with helpers.
 */
export async function mountPlugin(
  options: MountOptions = {}
): Promise<MountedPlugin> {
  const doc = options.noDocument
    ? (undefined as unknown as XMLDocument)
    : options.doc ?? (await loadFixture(options.fixture ?? 'supervisions.scd'));

  const host = document.createElement('div');
  host.style.width = '1280px';
  host.style.height = `${options.height ?? 600}px`;
  document.body.append(host);

  const plugin = document.createElement(tagName) as OscdEditorSupervision;
  const editor = new XMLEditor();
  const edits: EditV2[] = [];
  let version = 0;

  // Listening on the host, below `window`, mirrors the shell: the edit is
  // applied before the plugin's own listener, and an edit marked `squash` is
  // merged into the previous undoable commit.
  host.addEventListener('oscd-edit-v2', (event) => {
    const { edit, title, squash } = (event as EditEventV2).detail;
    edits.push(edit);
    editor.commit(edit, { title, squash });
    version += 1;
    plugin.docVersion = version;
  });

  plugin.doc = doc;
  plugin.docName = options.fixture ?? 'test.scd';
  plugin.docVersion = version;
  host.append(plugin);

  const settle = async (): Promise<void> => {
    for (let i = 0; i < 3; i += 1) {
      await plugin.updateComplete;
      const children = Array.from(plugin.shadowRoot?.querySelectorAll('*') ?? []);
      await Promise.all(
        children.map((child) => {
          const updating = child as Element & {
            updateComplete?: Promise<unknown>;
          };
          return updating.updateComplete ?? Promise.resolve();
        })
      );
    }
  };

  await settle();

  return {
    plugin,
    doc,
    edits,
    editor,
    host,
    settle,
    applyEdit: async (edit) => {
      host.dispatchEvent(newEditEventV2(edit));
      await settle();
    },
    openDocument: async (newDoc, docName) => {
      plugin.doc = newDoc;
      plugin.docName = docName;
      await settle();
    },
    undo: async () => {
      editor.undo();
      version += 1;
      plugin.docVersion = version;
      await settle();
    },
    redo: async () => {
      editor.redo();
      version += 1;
      plugin.docVersion = version;
      await settle();
    },
    unmount: () => {
      host.remove();
    }
  };
}

/**
 * Waits until a condition holds, with a short interval.
 * @param condition - the condition to wait for.
 * @param message - the failure message.
 */
export async function waitFor(
  condition: () => boolean,
  message: string
): Promise<void> {
  await waitUntil(condition, message, { interval: 5, timeout: 2000 });
}
