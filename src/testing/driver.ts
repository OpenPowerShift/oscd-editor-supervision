import { deepQuery, deepQueryAll, normalize } from './dom.js';
import type { MountedPlugin } from './plugin.js';

/** The plugin's list components a spec can drive. */
export type ListName = 'used' | 'available' | 'control';

/**
 * The only file that knows how the plugin is put together. Specs and screenshot
 * tests say what they want to do; this says which element to click.
 */
export class PluginDriver {
  constructor(private readonly mounted: MountedPlugin) {}

  private get root(): ShadowRoot {
    return this.mounted.plugin.shadowRoot!;
  }

  private child(name: string): HTMLElement {
    return this.root.querySelector(name)!;
  }

  private items(list: ListName): HTMLElement[] {
    const child =
      list === 'used'
        ? this.child('supervision-table')
        : list === 'available'
          ? this.child('available-supervisions')
          : this.child('control-block-list');
    return Array.from(
      child.shadowRoot?.querySelectorAll<HTMLElement>('oscd-list-item') ?? []
    );
  }

  private row(list: ListName, text: string): HTMLElement {
    const item = this.items(list).find(element =>
      normalize(element.textContent).includes(text)
    );
    if (!item) {
      throw new Error(`No row "${text}" in the ${list} list`);
    }
    return item;
  }

  private headline(element: HTMLElement): string {
    return normalize(
      element.querySelector<HTMLElement>('[slot="headline"]')?.textContent
    );
  }

  /** The headlines of a list, in order. */
  headlines(list: ListName): string[] {
    return this.items(list)
      .filter(element => element.classList.contains('row'))
      .map(element => this.headline(element));
  }

  /** The supervision path of each used row, in order. */
  supervisionNames(list: ListName): string[] {
    return this.items(list)
      .filter(element => element.classList.contains('row'))
      .map(element =>
        normalize(
          element.querySelector<HTMLElement>('.supervision-name')?.textContent
        )
      );
  }

  /** The control block name of each used row, in order. */
  controlNames(list: ListName): string[] {
    return this.items(list)
      .filter(element => element.classList.contains('row'))
      .map(element =>
        normalize(
          element.querySelector<HTMLElement>('.control-name')?.textContent
        )
      );
  }

  /** Opens the sort dialog. */
  async openSort(): Promise<void> {
    const sortButton = this.root.querySelector('sort-button')!;
    const dialog = sortButton.shadowRoot!.querySelector('oscd-dialog')!;
    const opened = new Promise<void>((resolve) => {
      dialog.addEventListener('opened', () => resolve(), { once: true });
    });
    (
      sortButton.shadowRoot!.querySelector('#sortButton') as HTMLElement
    ).click();
    await opened;
    const list = sortButton.shadowRoot!.querySelector(
      'oscd-selection-list'
    ) as HTMLElement & { updateComplete: Promise<unknown> };
    await list.updateComplete;
  }

  /** Chooses a sort order in the open dialog and applies it. */
  async chooseSort(label: string): Promise<void> {
    const sortButton = this.root.querySelector('sort-button')!;
    const dialog = sortButton.shadowRoot!.querySelector('oscd-dialog')!;
    const list = sortButton.shadowRoot!.querySelector('oscd-selection-list')!;
    await (list as HTMLElement & { updateComplete: Promise<unknown> })
      .updateComplete;
    const item = Array.from(
      list.shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item')
    ).find(element => normalize(element.textContent).includes(label));
    if (!item) {
      throw new Error(`No sort order "${label}" in the dialog`);
    }
    item.click();
    await this.settle();
    const closed = new Promise<void>((resolve) => {
      dialog.addEventListener('closed', () => resolve(), { once: true });
    });
    (
      sortButton.shadowRoot!.querySelector('oscd-filled-button') as HTMLElement
    ).click();
    await closed;
    await this.settle();
  }

  /** Whether the sort button shows a non-default order. */
  sortIsOffNominal(): boolean {
    return (
      this.root
        .querySelector('sort-button')!
        .shadowRoot!.querySelector('#sortButton')
        ?.classList.contains('off-nominal') ?? false
    );
  }

  /** The supporting text of the rows of a list, in order. */
  subheadings(list: ListName): string[] {
    return this.items(list)
      .filter(element => element.classList.contains('row'))
      .map(element =>
        normalize(
          element.querySelector<HTMLElement>('[slot="supporting-text"]')
            ?.textContent
        )
      );
  }

  private async settle(): Promise<void> {
    await this.mounted.settle();
  }

  /** Opens the IED selection dialog. */
  async openIedDialog(): Promise<void> {
    const selector = this.child('ied-selector');
    const dialog = selector.shadowRoot!.querySelector('oscd-dialog')!;
    const opened = new Promise<void>((resolve) => {
      dialog.addEventListener('opened', () => resolve(), { once: true });
    });
    (selector.shadowRoot!.querySelector('#iedButton') as HTMLElement).click();
    await opened;
    const list = selector.shadowRoot!.querySelector(
      'oscd-selection-list'
    ) as HTMLElement & { updateComplete: Promise<unknown> };
    await list.updateComplete;
  }

  /** Selects an IED in the open dialog and applies it. */
  async chooseIed(name: string): Promise<void> {
    const selector = this.child('ied-selector');
    const dialog = selector.shadowRoot!.querySelector('oscd-dialog')!;
    const list = selector.shadowRoot!.querySelector('oscd-selection-list')!;
    const item = Array.from(
      list.shadowRoot!.querySelectorAll<HTMLElement>('oscd-list-item')
    ).find(element => normalize(element.textContent).includes(name));
    if (!item) {
      throw new Error(`No IED "${name}" in the dialog`);
    }
    item.click();
    await this.settle();
    const closed = new Promise<void>((resolve) => {
      dialog.addEventListener('closed', () => resolve(), { once: true });
    });
    (
      selector.shadowRoot!.querySelector('oscd-filled-button') as HTMLElement
    ).click();
    await closed;
    await this.settle();
  }

  /** The name of the IED the selector button shows. */
  selectedIedName(): string {
    return normalize(
      this.child('ied-selector').shadowRoot!.querySelector<HTMLElement>(
        '.ied-name'
      )?.textContent
    );
  }

  /** Selects an IED from the button in one step. */
  async selectIed(name: string): Promise<void> {
    await this.openIedDialog();
    await this.chooseIed(name);
  }

  /** Switches between GOOSE and sampled values. */
  async setControlType(type: 'GOOSE' | 'SMV'): Promise<void> {
    const button = this.root.querySelector<HTMLElement>(
      `#controlSwitch oscd-outlined-segmented-button[data-control-type="${type}"]`
    );
    if (!button) {
      throw new Error(`No control type switch for ${type}`);
    }
    button.click();
    await this.settle();
  }

  /** Chooses an available supervision as the target of the next assignment. */
  async selectSupervision(path: string): Promise<void> {
    this.row('available', path).click();
    await this.settle();
  }

  /** Chooses the "new supervision" entry. */
  async selectNewSupervision(): Promise<void> {
    const item = this.items('available').find(element =>
      element.classList.contains('new')
    );
    if (!item) {
      throw new Error('No new supervision entry');
    }
    item.click();
    await this.settle();
  }

  /** Creates an empty supervision logical node. */
  async createSupervision(): Promise<void> {
    (
      deepQuery(
        this.child('available-supervisions').shadowRoot!,
        '#createNewLN'
      ) as HTMLElement
    ).click();
    await this.settle();
  }

  /** Assigns a control block to the selected supervision. */
  async selectControlBlock(name: string): Promise<void> {
    this.row('control', name).click();
    await this.settle();
  }

  /** Empties the reference of a used supervision. */
  async disconnect(path: string): Promise<void> {
    const item = this.row('used', path);
    (
      item.querySelector(
        'oscd-icon-button[data-action="disconnect"]'
      ) as HTMLElement
    ).click();
    await this.settle();
  }

  /** Deletes a used supervision. */
  async deleteUsed(path: string): Promise<void> {
    const item = this.row('used', path);
    (
      item.querySelector(
        'oscd-icon-button[data-action="delete"]'
      ) as HTMLElement
    ).click();
    await this.settle();
  }

  /** Deletes an available supervision. */
  async deleteAvailable(path: string): Promise<void> {
    const item = this.row('available', path);
    (
      item.querySelector(
        'oscd-icon-button[data-action="delete"]'
      ) as HTMLElement
    ).click();
    await this.settle();
  }

  /** Types into one of the search fields. */
  async search(list: 'available' | 'control', text: string): Promise<void> {
    const child =
      list === 'available'
        ? this.child('available-supervisions')
        : this.child('control-block-list');
    const field = child.shadowRoot!.querySelector<HTMLElement>(
      'oscd-outlined-text-field'
    )!;
    (field as HTMLElement & { value: string }).value = text;
    field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await this.settle();
  }

  /** The text of the read-only notice, or undefined when there is none. */
  notice(): string | undefined {
    const notice = this.root.querySelector('.notice');
    return notice ? normalize(notice.textContent) : undefined;
  }

  /** The text of the "no IEDs" heading, or undefined. */
  emptyHeading(): string | undefined {
    const heading = this.root.querySelector('h1');
    return heading ? normalize(heading.textContent) : undefined;
  }

  /** Every element below the plugin which was not upgraded. */
  notUpgraded(): string[] {
    const found = new Set<string>();
    const visit = (node: ParentNode): void => {
      deepQueryAll(node, '*').forEach((element) => {
        const name = element.tagName.toLowerCase();
        if (name.includes('-') && element.constructor === HTMLElement) {
          found.add(name);
        }
      });
      node.querySelectorAll('*').forEach((element) => {
        if (element.shadowRoot) {
          visit(element.shadowRoot);
        }
      });
    };
    visit(this.root);
    return [...found];
  }
}
