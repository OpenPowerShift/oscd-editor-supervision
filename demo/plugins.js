import OscdMenuOpen from '@omicronenergy/oscd-menu-open';
import OscdMenuSave from '@omicronenergy/oscd-menu-save';

// The built plugin, as the deployed bundle has it.
import OscdEditorSupervision from '../dist/oscd-editor-supervision.js';

/**
 * The shell shows plugins in its own scoped registry, so they are defined there.
 * @param registry - the registry of the `oscd-shell`.
 */
export function definePlugins(registry) {
  registry.define('oscd-menu-open', OscdMenuOpen);
  registry.define('oscd-menu-save', OscdMenuSave);
  registry.define('oscd-editor-supervision', OscdEditorSupervision);
}

export const plugins = {
  menu: [
    {
      name: 'Open File',
      translations: { de: 'Datei öffnen' },
      icon: 'folder_open',
      tagName: 'oscd-menu-open'
    },
    {
      name: 'Save File',
      translations: { de: 'Datei speichern' },
      icon: 'save',
      requireDoc: true,
      tagName: 'oscd-menu-save'
    }
  ],
  editor: [
    {
      name: 'Supervision',
      translations: { de: 'Überwachung', pt: 'Supervisão' },
      icon: 'ecg',
      requireDoc: true,
      tagName: 'oscd-editor-supervision'
    }
  ]
};
