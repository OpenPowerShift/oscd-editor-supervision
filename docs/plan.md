# oscd-supervision upgrade plan

Status: **approved 2026-10-19** — implementation in progress
Branch: `upgrade` (created from `main` at `7526cd1`, 2024-09-26)
Date: 2026-10-19

Worklog and step status are at the end of this file. Read section 10 before
approving.

---

## 1. Current state

### 1.1 Repository

| Item | Value |
|---|---|
| Remote | `https://github.com/danyill/oscd-supervision` (the `OpenPowerShift/...` URL in the brief does not exist: it returns 404) |
| Branch | `main` at `7526cd1` "docs: Improve image links" |
| Package name | `oscd-supervision`, version `0.0.0`, **never published** (`npm view oscd-supervision` → 404). Target name: `oscd-editor-supervision` (Q1) |
| Entry point | `oscd-supervision.ts`, a single 1487-line class with no `customElements.define` (the host defines the tag from the module's default export) |
| Tracked files | 120, including 64 PNG baselines (5.8 MB) and a stale `custom-elements.json` |

### 1.2 Dependencies (as declared)

| Group | Packages |
|---|---|
| UI (legacy) | `@material/mwc-button`, `-checkbox`, `-dialog`, `-formfield`, `-icon`, `-icon-button`, `-icon-button-toggle`, `-list`, `-menu`, `-textfield` (all `^0.27.0`); `@openscd/oscd-filtered-list` `^1.1.1` |
| SCL / edits (legacy) | `@openenergytools/scl-lib` `^0.12.1`; `@openscd/open-scd-core` `^0.0.2` |
| Runtime | `lit` `^3.1.0` |
| Test libraries declared as runtime deps | `@open-wc/testing` `^4.0.0`, `@web/test-runner-commands`, `@web/test-runner-playwright`, `@web/test-runner-visual-regression`, `pixelmatch`, `pngjs` |
| Tooling | TypeScript 5.3, ESLint 8 + `@open-wc/eslint-config` + `@typescript-eslint` + `eslint-plugin-tsdoc`, Prettier 3, Rollup 3 + `@open-wc/building-rollup` + `@rollup/plugin-*` + `rollup-plugin-copy`, Web Test Runner 0.18, Web Dev Server 0.4, `@custom-elements-manifest/analyzer`, `typedoc`, `husky` 8, `lint-staged`, `concurrently`, `rimraf`, `gh-pages` |
| Duplicate / unused | `@open-wc/testing` is declared twice (`^4.0.0` in `dependencies`, `^3.1.6` in `devDependencies`); `@types/object-inspect` is unused |

### 1.3 Legacy imports in `src/`

| Import | Where | Count |
|---|---|---|
| `@material/mwc-*` | `oscd-supervision.ts:20-34`, `foundation/components/oscd-filter-button.ts:4-7`, `foundation/components/oscd-filtered-list-old.ts:3-10` | 3 files |
| `@openenergytools/scl-lib` | `oscd-supervision.ts:11-17`, `foundation/subscription/subscription.ts:1` (deep path `dist/tLN/supervision/removeSupervision.js`, not a published entry point) | 2 files |
| `@openscd/open-scd-core` | `oscd-supervision.ts:18` (`Edit`, `newEditEvent`), `foundation/subscription/subscription.ts:3` (`Edit`) | 2 files |
| `@openscd/oscd-filtered-list` | `oscd-supervision.ts:29`, `:35` | 1 file |
| Edit API v1 | `newEditEvent` in 6 places (`:697`, `:783`, `:984`, `:1002`, `:1117`), v1 `Edit` arrays at `:976-984` | 5 dispatches |
| `lit-translate` | none | 0 |
| `@openenergytools/*` UI | none | 0 |

`demo/index.html` also imports `@openscd/open-scd-core/open-scd.js`; the old
screenshot suite imports it too (`test/integration/supervision.test.ts:13-14`).

### 1.4 Build, lint, test

| Script | What it does | Notes |
|---|---|---|
| `build` | `tsc -b` | `rootDir: "./"`, so `dist/` contains `test/` and the entry point at `dist/oscd-supervision.js` |
| `bundle` | `rimraf dist && rollup -c` | copies `demo/index.deploy.html` into `dist` |
| `lint` | ESLint + `prettier --check` | ESLint config inline in `package.json` |
| `test` | `playwright install && wtr --coverage` | runs only the `visual` group |
| `test:update` | `wtr --update-visual-baseline` | |
| `start` | `tsc -b --watch` + `wds` | |
| `deploy` | `gh-pages --dist dist` | |
| hooks | Husky `pre-commit` → `lint-staged`, `pre-push` → `git lfs` | `core.hooksPath=.husky` |

### 1.5 Tests and coverage

* One test file, `test/integration/supervision.test.ts`, 922 lines, **31 tests**.
* Every test boots the whole `open-scd` shell, loads the plugin through a
  `<script>` element, clicks with `sendMouse` at computed pixel coordinates and
  ends with `visualDiff`. **0 `expect()` calls**: the screenshot is the only
  assertion.
* 78 `setTimeout`/`timeout()` waits; the suite takes minutes and is unreliable
  (5 failed screenshots are present in `test/screenshots/failed/`).
* 64 baselines: 32 test names × Chromium and Firefox. Baselines are **normal
  Git files, not LFS** (`git lfs ls-files` → 0), although the hooks and the
  development page claim LFS.
* Last recorded coverage, `coverage/lcov.info`, is from January 2024 and stale:
  95.81 % statements (1989/2076), 85.41 % branches (281/329), 90.91 % functions
  (60/66). It is incidental: no assertion checks the code's output.
* Fixtures: `supervisions.scd` (11 IEDs, 60 ExtRefs, LGOS and LSVS),
  `no-IEDs-present.scd`, `SMV-2007B4-LSVS.scd` (unused by any test).

### 1.6 CI

| Workflow | Trigger | Problems |
|---|---|---|
| `test.yml` | `push` (all branches) | `actions/checkout@v3`, `setup-node@v3`, Node 20, `upload-artifact@v3` (retired), LFS checkout, no lint, no `workflow_call`, no docs check |
| `test-on-pr-branch.yml` | `pull_request` | duplicates `test.yml`; same retired actions |
| `deploy.yml` | `push` to `main` | deploys without tests; retired actions |

No release workflow, no release-please files, no `files` field in
`package.json`. Because `.gitignore` lists `/dist` and there is no `files`
field, **`npm pack` would publish everything except `dist/`**, while `main`
points at `dist/oscd-supervision.js`.

### 1.7 Docs

* `antora.yml` and `modules/` are at the repository root, not in `docs/`.
* Pages: `introduction`, `usage`, `allowing_supervision_modifications`,
  `installation`, `support`, `development`.
* `partials/base.adoc` sets `:plugin-name: oscd-subscriber-later-binding` and
  `:plugin-title: Subscriber Later Binding` — the wrong plugin, so every title
  and URL in the component is wrong.
* `development.adoc` links the later-binding docs and demo, says the repository
  uses Git LFS, and lists `npm run format` and `npm run test:watch`.
* `installation.adoc` documents later-binding add-on plugins that this plugin
  does not have, and a `link` icon where the plugin uses `ecg`.
* `usage.adoc` says search is case-sensitive (it is case-insensitive), says
  descriptions come from `LDevice`, `LLN0` and `GSEControl` (the code uses the
  control block's `desc` and the `LN0` `desc`, not `LDevice`), and says the first
  supervision cannot be deleted "to maintain the integrity of the references".
* Images are committed copies, not symlinks to baselines, and are from 2024.

---

## 2. Target architecture

### 2.1 Package layout

```
package.json          ESM, "type": "module", files: dist minus specs/tests/testing/demo
tsconfig.json         extends @omicronenergy/oscd-tooling base; rootDir ./src, outDir ./dist
eslint.config.js      thin extension of the shared config (editor integration)
web-test-runner.config.js  thin extension of the shared config + coverage thresholds
rollup.config.js      thin extension of the shared config (plugin + demo)
release-please-config.json, .release-please-manifest.json
.gitattributes        test/**/*.png binary
src/
  oscd-editor-supervision.ts   root component: state and orchestration only
  theme.ts                     oscdMd3Mappings -> internal --oscd-* palette
  components/
    ied-selector.ts            IED button + selection dialog + current IED heading
    supervision-table.ts       the used supervisions, each row with its control block and actions
    available-supervisions.ts  search field, list of unassigned supervisions, create button
    control-block-list.ts      search field and list of assignable control blocks
  foundation/
    control-block.ts           reference, path, description, dataset/id, sorting key
    supervision.ts             CB reference, path, description, template LN, limits, editability
    model.ts                   one indexed model per document version: control blocks,
                               subscribed refs, supervised refs, supervisions, limits
    actions.ts                 EditV2 factories: assign, disconnect, delete, create LN
    rows.ts                    row models for the three lists, with attachedElement
    search.ts                  getSearchRegex
    sort.ts                    numeric-aware collator and row comparators
  testing/
    plugin.ts                  mounts the plugin and applies its edits as a host does
    driver.ts                  the only file that knows the DOM structure
    fixtures.ts                loads test/fixtures/*.scd
test/fixtures/*.scd
test/screenshots/baseline/   owned by CI
demo/index.html, demo/plugins.js, demo/sample.scd
docs/antora.yml, docs/modules/ROOT/{nav.adoc,pages,partials,images}
```

### 2.2 Components

| Component | Responsibility | Sibling spec |
|---|---|---|
| `oscd-editor-supervision` | Owns `doc`, `docName`, `docVersion`, `controlType`, `selectedIedName`, `selectedControl`, `selectedSupervision`; builds the model; dispatches one EditV2 event per user action; renders header and both sections | `oscd-editor-supervision.spec.ts` (orchestration, sizing, empty states, edit dispatch) |
| `ied-selector` | Button with the current IED, dialog with a single-select list of IEDs (name, type, manufacturer, description) | `ied-selector.spec.ts` |
| `supervision-table` | One row per supervision: name, path, description, status (assigned/invalid/not subscribed), control block, and labelled actions (assign, disconnect, delete) | `supervision-table.spec.ts` |
| `available-supervisions` | Search, list of unassigned supervision LNs, "New LGOS/LSVS supervision" item, create button with remaining count | `available-supervisions.spec.ts` |
| `control-block-list` | Search, list of control blocks the IED subscribes to but does not supervise | `control-block-list.spec.ts` |

All four child components use `ScopedElementsMixin` and register every tag they
render. No global `customElements.define` in `src/` (specs may define a test-only
host tag). All user-visible text goes through `msg()`.

### 2.3 Foundation modules (pure, each with a unit spec)

| Module | Functions | Spec |
|---|---|---|
| `control-block.ts` | `controlBlockReference` (delegates to scl-lib `controlBlockObjRef`), `controlBlockPath`, `controlBlockDescription`, `controlBlockDataset`, `controlBlockId`, `controlBlockSortKey` | `control-block.spec.ts` |
| `supervision.ts` | `supervisionReference`, `supervisionPath`, `supervisionDescription`, `supervisionLns`, `templateSupervisionLn`, `maxSupervisions`, `instantiatedSupervisions`, `availableSupervisions`, `isModificationAllowed`, `isSupervisionEditable`, `canDeleteSupervision` | `supervision.spec.ts` |
| `model.ts` | `buildModel(doc, ied, controlType)` → `{ controlBlocks, subscribed, supervised, supervisions, limits, template, editable }`, built with one pass over the document | `model.spec.ts` |
| `actions.ts` | `assignSupervisionEdit(ln, cb)`, `disconnectSupervisionEdit(ln)`, `deleteSupervisionEdit(ln)`, `createSupervisionLnEdit(ied, type)` — all return `EditV2 \| null` | `actions.spec.ts` |
| `rows.ts` | `buildSupervisionRows`, `buildAvailableRows`, `buildControlBlockRows`, `matchesSearch` | `rows.spec.ts` |
| `search.ts` | `getSearchRegex` (fixed tokenizer) | `search.spec.ts` |
| `sort.ts` | `collator`, `compareRows` | `sort.spec.ts` |

Rows carry the SCL `Element` they describe (`attachedElement`), so no action
looks an element up again by an identity string. This removes the
identity-collision and misalignment failure modes described in section 3.

---

## 3. Logic review

Severity: **H** = wrong data, data loss or a broken package; **M** = wrong or
misleading behaviour; **L** = cosmetic or robustness.

| ID | Severity | Finding (evidence) | Proposed fix |
|---|---|---|---|
| L1 | **H** | Delete and disconnect are bound to list *selection*, not to a button. The row itself is the control (`renderDeleteIcons` `@selected` at `:686-703`, `renderUsedSupervisionRemovalIcons` `:766-790`). Selecting a row deletes immediately. There is no labelled, focusable action, so keyboard and screen-reader users cannot know what a selection does and can delete by selecting. | One row per supervision with real `oscd-icon-button`s, each with `aria-label` and `title`; the row itself only selects. |
| L2 | **H** | The used section is four sibling lists used as columns (`renderUsedSupervisionLNs`, `renderDeleteIcons`, `renderUsedSupervisionRemovalIcons`, `renderUsedControls`). Row heights must match exactly. If a supervision has no control block (`renderUsedControls` `.find(...)!` → `undefined` → `renderControl` returns nothing) or text wraps, every icon below shifts and a delete can hit the wrong supervision. | A single list whose row template contains the supervision, its control block and its actions. |
| L3 | **H** | Actions resolve elements by identity string: `find(this.doc, 'LN', ln)` (`:690`, `:770`, `:1064`) and `find(this.doc, controlTag[...], control)` (`:960`). The fixture `supervisions.scd` has two `LGOS` with `inst="3"` in `GOOSE_Subscriber4` (lines 478 and 487), so both have the same identity and `find` always returns the first. Deleting the second deletes the first. | Carry the `Element` in the row; never round-trip through `identity`/`find`. |
| L4 | **H** | The package cannot be published correctly: no `files` field, and `.gitignore` contains `/dist`, so `npm pack` omits the built entry point that `main`/`module`/`exports` point at. | Add `files: ["dist", "!dist/**/*.spec.*", "!dist/**/*.test.*", "!dist/testing", "!dist/demo"]`; verify with `npm pack --dry-run`. |
| L5 | **H** | Undo/redo does not refresh the plugin: the component reads the legacy `editCount` (`:334`, `:485`), which `oscd-shell` does not provide. After undo the lists show the document as it was before. | Use `docVersion`; rebuild the model when it changes. |
| L6 | **M** | A supervision whose control block has been removed is shown, but the control block cell is empty (L2). Its CB reference is also counted as "invalid" only if it is not in `otherIedsCBRefs`; the same ref may be absent because the publisher IED is not in the file, which the UI reports as "Invalid Control Block reference" rather than "publisher not in this file". | Distinguish "control block missing from the document" from "not subscribed"; show a specific message for each. |
| L7 | **M** | Reassignment is two dispatches computed from the unedited document (`:976-1002`). `instantiateSubscriptionSupervision` refuses an LN that already holds a valid reference, so the plugin removes the old value first and then inserts the new one in a second event. That is two undo steps and a transient invalid state, and the second edit is computed before the first is applied. | One `assignSupervisionEdit`: `SetTextContent` on the existing `Val`, or `Insert` of the missing `Val`/`DAI`/`DOI`, as one EditV2. One undo step, no transient state. |
| L8 | **M** | `controlBlockReference` (`foundation/subscription/subscription.ts:18-30`) builds `${iedName}${ldInst}/…` even when a part is missing, producing values such as `IEDundefined/…`, and returns `null` only when *all* parts are missing. It also disagrees with scl-lib's `controlBlockObjRef`. `'Unknown Control'` is inserted into the subscribed set (`:215`, `:305`). | Use scl-lib `controlBlockObjRef` (returns `null` unless IED, LDevice, LN class and control name are present); never add a placeholder to a set. |
| L9 | **M** | Subscriptions without `serviceType` are invisible: `isGOOSEorSMV` (`:120-125`) returns `false` when neither `serviceType` nor `pServT` is set. IEC 61850-6 makes `serviceType` optional; a subscription written by another tool without it is not counted, so its control block appears unsubscribed and can get a duplicate supervision. | Resolve each ExtRef with scl-lib `sourceControlBlock` and classify by the resolved control block's tag (`GSEControl` / `SampledValueControl`), not by the ExtRef's attributes. |
| L10 | **M** | Creating an empty supervision LN picks `inst` as the minimum free value across the **whole IED** (`minAvailableLogicalNodeInstance` over all LNs of that class, `foundation/subscription/subscription.ts:110-121`), but `inst` must be unique **within its LDevice**. With `LGOS 1,2` in one LDevice and `LGOS 1,2` in another, the new LN gets `3` and a free `1`/`2` is skipped; scl-lib's generator is per LDevice. | Compute `inst` within the target LDevice (or reuse scl-lib's `instantiateSubscriptionSupervision` with `newSupervisionLn`). |
| L11 | **M** | A new LN loses the `prefix` of the supervision type (`createNewSupervisionLnInst` copies only `lnType`; scl-lib copies `prefix` too). An IED that uses `prefix="S"` gets an LN outside its instance namespace. | Copy `prefix` from the template LN. |
| L12 | **M** | The insert reference for a new LN is `parent.querySelector('LN[lnClass="LGOS"]:last-child')?.nextElementSibling ?? null` (`foundation/subscription/subscription.ts:152-158`). `:last-child` requires the LN to be the parent's last child; otherwise the reference is `null` and the host appends the LN after `AccessControl`, which is schema-invalid order. | Use the last matching LN's `nextElementSibling`, or scl-lib `getReference(parent, 'LN')`. |
| L13 | **M** | The "first supervision cannot be deleted" rule (`renderDeleteIcons:680-683`) uses the first LN in *identity sort order* across all LDevices. It can block a used supervision in one LDevice while allowing deletion of the true template LN in another. The rule's purpose (keep a template for new LNs) is real but the implementation is not. | Refuse deletion of the first supervision LN of the class in the IED, in **document order** (Q3); explain it in the tooltip. Every other LN can be deleted. |
| L14 | **M** | When the selected IED disappears (removed by another plugin or by undo), `selectedIed` returns `undefined` and the whole lower section vanishes, although the comment at `:371-373` says the first IED is selected instead. | Fall back to the first IED of the document, or show an explicit empty state. |
| L15 | **M** | Large documents: `getSubscribedCBRefs` calls scl-lib `sourceControlBlock` for every `ExtRef` of the IED, and that function runs a document-wide `querySelector` per call; `getOtherIedControlElements` scans every `LN0 > *Control` in the document; `render` recomputes and re-sorts the supervision list at least four times. `updateCBRefInfo` runs on every edit. With 1000 IEDs or 5000 ExtRefs this is seconds per edit. | One `buildModel` per document version: index control blocks by object reference once, map ExtRefs by attributes, sort once. Cache on `(doc, docVersion, ied, controlType)`. |
| L16 | **M** | The plugin cannot be used at all when the IED has no `Services > SupSubscription`, but the UI only hides the lower section when the supervision LN is not editable. Everything is then disabled with no explanation. | Separate "no template LN", "not editable (`valImport`/`valKind`)" and "no `SupSubscription`" states, each with its own message and a link to the docs page. |
| L17 | **L** | `percentUsed` is `NaN` when there are no supervisions (`:1171-1173`), which shows "0 / 0 used" and an unpredictable icon from `getUsageIcon(NaN)`. | Guard the division; show the count without an icon when the total is 0. |
| L18 | **L** | `searchUnusedSupervisions` is `@property({ type: String })` on a `RegExp` (`:367-368`); the string converter would corrupt it if an attribute were set, and the property is not needed as reactive state. | Make the search text `@state()` and the regex a derived value. |
| L19 | **L** | `getSearchRegex` merges a bare term with a following quoted phrase into one token (`a"b c"` → `ab c`) because the token pattern concatenates alternatives. | Tokenize quotes and bare terms separately; keep the existing case-insensitive AND, `*`, `?` behaviour. |
| L20 | **L** | `getUsageIcon` / `progressIcons` map a percentage to a Material icon; the text "N / M used" is the only accurate information and the icon is colour-independent but meaningless to a screen reader. | Keep the text; give the icon `aria-hidden` or drop it. |
| L21 | **L** | `controlBlockDescription` and `supervisionPath` join path parts with `' '` around `/`, producing `QB2_Disconnector / LLN0`; `renderControl` prints a stray `}` after the id (`(Id: …)}`, `:834`); `controlId` prints `undefined` when `appID`/`smvID` is absent. | Build paths without spaces around `/`; fix the brace; omit absent ids. |
| L22 | **L** | `foundation/icons.ts` contains a stray `'` inside the SMV SVG (`svg`'<path …`) and `xmlns="http://www.w3.orgs/2000/svg"` (typo, `w3.orgs`). | Delete the module; use `oscd-icon` with the SCL icon names `gooseIcon` / `smvIcon`. |
| L23 | **L** | `compareNames` (`foundation/foundation.ts`) has unreachable branches and uses `localeCompare` without numeric collation, so `IED10` sorts before `IED2`. `getSelectedIedSupLNs` pads `inst` to five digits but sorts the parent identity as a string, so `>>10` sorts before `>>2`. | Use `Intl.Collator('en', { numeric: true })`; sort by document order then `inst`. |
| L24 | **L** | `renderUnusedSupervisionLNs` emits an unbalanced `</div>` and a duplicate `</span>` (`:664-670`). Browsers recover, but the "N available" text is inside the wrong element. | Fix the template. |
| L25 | **L** | `@state()` decorates getters (`iedList`, `selectedIed`) that have no setter; the decorator has no effect and the getters are recomputed on every render. `@queryAll('.mlist.deleter')` carries `// TODO: Why???` and is only used to call MWC `layout()`. | Remove the decorators and the MWC `layout()` calls. |
| L26 | **L** | `debounce` is typed `any` (`:185-194`); `searchUnusedSupervisionLN` returns `boolean` but can return `null`-ish (`this.searchUnusedSupervisions && …`). | Type the debounce helper; return a strict boolean. |
| L27 | **L** | Dead code: `.moving` style, `.sup-btn`, `.item-grouper`, `.greyOutDisabled` (used only by one button), `getIconButton`, `iconType`, `supervisionLnType` duplicated with `controlTag`, `selectedUsedSupervisionDeleteUI`/`selectedUsedSupervisionRemoveUI`/`selectedUnusedSupervisionDeleteUI` queries that are never read. | Remove in the rewrite. |

### 3.1 Not a defect, but must be preserved

* Only control blocks from **other** IEDs are offered, and only those the
  selected IED already subscribes to. That is the plugin's purpose: it
  supervises existing subscriptions.
* Assignment is refused when the IED has no supervision LN of that class,
  because scl-lib needs a template LN to copy `lnType` and `prefix` from.
* `Services > SupSubscription/@maxGo` / `@maxSv` bound the number of supervision
  LNs. scl-lib also allows reusing an empty LN at the limit.
* A supervision LN is editable only when its `setSrcRef` is editable through
  `DOI/DAI[@valImport="true"][@valKind="RO"|"Conf"]` or the same on
  `LNodeType > DO > DOType > DA`.
* Disconnecting keeps the LN and empties its `Val`; deleting removes the LN.

### 3.2 SCL validity notes

* `Private` must come before `DataSet`, `ReportControl`, `LogControl`, `DOI` and
  `Inputs` in an `LN` (tAnyLN sequence). scl-lib's `createSupervisionLogicalNode`
  does this correctly; the local `createNewSupervisionLnInst` appends `Private`
  to an empty `LN`, which is correct as long as the `DOI` is inserted after it.
  The new `actions.ts` keeps that order.
* `inst` is unique per `LDevice` and in the range 1–99 (L10).
* `Val` is a text-only element; assignment must replace its text, not append a
  second text node (L7).
* `GSEControl/@appID` and `SampledValueControl/@smvID` are optional; do not
  print `undefined`.

---

## 4. UI review

| ID | Problem | Proposed change |
|---|---|---|
| U1 | Height is guessed: `#container { height: calc(100vh - 112px) }`, `#scrollableArea { height: calc(100vh - 200px) }`, plus a `700px` media query (`:1254-1286`). In a host with a different header the plugin overflows and the host scrolls. | `:host { display: flex; flex-direction: column; height: 100% }`, content `flex: 1 1 auto; min-height: 0`, the two sections scroll internally. No `vh` anywhere. |
| U2 | Colours come from `--mdc-theme-*` with light-only fallbacks (`--disabledVisibleElement: rgba(0,0,0,.38)`), so the plugin is unreadable in a dark theme. | Map `--oscd-theme-*` to the internal `--oscd-*` palette on `:host`, then `oscdPaletteMd3` to point the oscd-ui components at it, as the theming guide and the reference do. |
| U3 | No page structure: `<h1>No IEDs present</h1>` and `<h3>No supervision nodes used</h3>` sit outside the layout; there is no `h1` in the normal view; headings are used as list-row labels. | One `h1` per state, `h2` per section, list rows are not headings. Empty states are centred blocks with a short explanation. |
| U4 | Columns are four sibling lists with placeholder rows to line up icons (L2). | One list, each row a grid: supervision (name, path, description), control block, actions. |
| U5 | Actions are bare icons with `title` only; `label` on `mwc-icon` does nothing; no keyboard access (L1). | `oscd-icon-button` with `aria-label` and `title`, disabled state with a reason. |
| U6 | The GOOSE/SMV switch is an `mwc-icon-button-toggle` with two SVGs and no text or accessible name; its state is not bound to `controlType`. | `oscd-outlined-segmented-button-set` with the text labels *GOOSE* and *Sampled values* (or two buttons), bound to `controlType`. |
| U7 | The IED selector is an unlabelled dialog of radio items; the current IED heading shows "No IED Selected (Unknown Type)". | Labelled dialog, a search field when there are many IEDs, heading shows name and type, or an empty state. |
| U8 | The "modifications not allowed" state is a warning icon with a tooltip; the lower half of the screen silently disappears. | A message block that names the cause (no supervision LN, `setSrcRef` not editable, no `SupSubscription`) with a link to the docs page. |
| U9 | Search behaviour differs between the two lists: the supervision search supports quotes and wildcards, the control block list uses the legacy filtered list's whitespace split. Neither field has a label. | One search component with one behaviour (case-insensitive, AND, quotes, `*`, `?`), a placeholder, and a clear button. |
| U10 | Wording is inconsistent and untranslated: "SV" / "SMV" / "Sampled Value"; "LGOS Supervisions"; "No supervision nodes used"; "Control block not subscribed"; "Invalid Control Block reference"; "IED Selector"; `(Id: …)}`. | One term per concept (*GOOSE*, *sampled values*, *supervision*, *control block*), sentence case, `msg()` for every string, no stray punctuation. |
| U11 | The usage indicator is an icon plus "N / M used"; at 0 supervisions it shows `0 / 0 used` and a random icon (L17). | Text `N of M supervisions used`, with the icon hidden from assistive technology and omitted when M is 0. |
| U12 | Deleting a used supervision and disconnecting look almost the same; the difference is a heart-minus versus a bin with no text. | Distinct labelled actions: *Disconnect* and *Delete*, with a tooltip that states what happens to the LN. |
| U13 | No focus styles, no skip link, no `aria-live` announcement after an edit. | Visible focus rings from oscd-ui, `role="status"` region that announces the last change. |
| U14 | Scroll containers: the whole page scrolls, including the headings; the two columns cannot scroll independently. | Header fixed, each section scrolls, both columns scroll together. |
| U15 | The empty state when there are no IEDs is a bare `h1`; when there are no supervisions it is an `h3` in one column only. | Empty states for: no document, no IEDs, no supervisions, no assignable control blocks, and no search results. |

---

## 5. Test strategy

### 5.1 Unit tests (`src/foundation/**/*.spec.ts`)

One spec per module in section 2.3, with a table-driven case list. Cover:

* reference/path/description building, including missing IED, LDevice, `desc`,
  `datSet`, `appID`/`smvID`, and `prefix`;
* `inst` selection within an LDevice, `prefix` copying, insert order before
  `AccessControl`;
* `assignSupervisionEdit` for all four document shapes (existing `Val`, `DAI`
  without `Val`, `DOI` without `DAI`, no `DOI`);
* `disconnect` and `delete` for editable and non-editable LNs, and for an LN
  with no `Val`;
* limits: `maxGo`/`maxSv` absent, zero, at the limit with an empty LN, over the
  limit;
* `serviceType` present, absent, `pServT` only, `Poll`;
* search tokenizer: quotes, `*`, `?`, special characters, adjacent bare and
  quoted terms (L19);
* sorting: `IED2` before `IED10`, `LGOS 2` before `LGOS 10`, document order.

### 5.2 Component tests (`src/**/*.spec.ts`)

* `src/testing/plugin.ts` mounts the plugin with an `XMLEditor`, listens for
  `oscd-edit-v2` on the container, applies each edit to the document, increments
  `docVersion`, and returns `{ plugin, doc, edits, editor, applyEdit,
  openDocument, settle, unmount }`.
* `src/testing/driver.ts` is the only file that knows the DOM: it exposes
  `selectIed(name)`, `setControlType('GOOSE' | 'SMV')`, `selectSupervision(id)`,
  `selectNewSupervision()`, `selectControlBlock(id)`, `disconnect(id)`,
  `delete(id)`, `createSupervision()`, `search(list, text)`, `rows(list)`,
  `openIedDialog()`, `closeIedDialog()`.
* No fixed waits, no `setTimeout`, no pixel coordinates. Wait for `opened`,
  `closed`, `updateComplete` or `waitUntil`.
* Every test checks the resulting SCL (elements, attributes, text, order) and
  the dispatched `EditV2` (shape and count), not only the DOM.
* Parent spec checks orchestration only: which child event produces which edit,
  document replacement, undo/redo refresh, and the 600 px sizing rule.

### 5.3 Screenshot tests (`src/oscd-editor-supervision.test.ts`)

One screenshot per important state (Chromium only):

| State | Name |
|---|---|
| LGOS view, IED selected | `lgos initially` |
| IED dialog open | `ied selector open` |
| LSVS view | `lsvs initially` |
| Supervision selected, control blocks available | `supervision selected` |
| Control block list with no match | `search without a match` |
| No IEDs | `without ieds` |
| IED with no supervisions | `without supervisions` |
| Modifications not allowed | `not editable` |
| At the supervision limit | `at the maximum` |
| Supervision with a missing control block | `with a missing control block` |
| Supervision with an unsubscribed control block | `with an unsubscribed control block` |
| All supervisions assigned | `all supervisions assigned` |

Rules: wait for the `opened`/`closed` events of dialogs; assert that a selected
row is inside the captured area; fonts from `node_modules`.

### 5.4 Coverage

* `npm test` runs `dist/**/*.spec.js` only and enforces:
  statements ≥ 95, branches ≥ 90, functions ≥ 95, lines ≥ 95.
* The visual group is excluded from thresholds.
* Target: suite under 10 s locally (Chromium, no shell, no screenshots).

### 5.5 Baselines

* Old 64 baselines and the old integration suite are deleted: the UI is
  rewritten, so every pixel changes.
* New baselines are produced only by CI (`Update visual baselines`). Locally I
  run `npm run test:visual` only to confirm the tests execute and to inspect
  `test/screenshots/failed/`, then delete that directory. No baseline is
  created or committed locally.

---

## 6. CI and release plan

| File | Content |
|---|---|
| `.github/workflows/test.yml` | `push` with `branches-ignore: [main]`, `pull_request`, `workflow_call` with `visual` boolean. `unit` job: checkout v4, Node 22, `npm ci`, `npm run lint`, docs image check (`find docs -xtype l`), Playwright cache, `npx playwright install --with-deps chromium`, `npm test`, upload coverage. `visual` job on PR or `visual: true`: `npm run test:visual`, failure hint about the label, upload `test/screenshots/failed`. |
| `.github/workflows/update-visual-baselines.yml` | Copied from the reference: `workflow_dispatch` and `pull_request: [labeled]`, guard for forks, `npx oscd test --update`, commit `test/screenshots/baseline`, remove the label. |
| `.github/workflows/release.yml` | "Release and deploy": `test` calls `test.yml` with `visual: true`; `release-please` needs `test`, uses `secrets.RELEASE_PLEASE_TOKEN`; `npm-publish` needs `release-please`, runs on `release_created`, `id-token: write`, latest npm, `npm publish --access public`; `deploy` needs `test`, `contents: write`, `npm run bundle`, `JamesIves/github-pages-deploy-action@v4` to the `gh-pages` branch (Q2). |
| deleted | `deploy.yml`, `test-on-pr-branch.yml` |
| `release-please-config.json` | `bootstrap-sha: 7526cd1b46d90d6040b5bac93a8f8b5d29cb4266`, `release-type: node`, `package-name: oscd-editor-supervision` |
| `.release-please-manifest.json` | `{ ".": "0.0.0" }` |
| `.gitattributes` | `test/**/*.png binary` |

Validate each YAML file with a parser before committing. No separate deploy
workflow: nothing is released or deployed unless `test` passes.

---

## 7. Documentation plan

Move `antora.yml` and `modules/` into `docs/` with `git mv`. Antora component
name `oscd-editor-supervision`, title *Supervision*.

| Page | Content | Screenshots |
|---|---|---|
| `introduction.adoc` | What the plugin does, GOOSE and sampled values, what it needs in the SCL file, limits | `lgos-initially.png` |
| `installation.adoc` (*Get the plugin*) | Online demo, npm package, editor-plugin entry for a distribution, icon `ecg`, `requireDoc: true` | — |
| `screen_layout.adoc` (*The screen*) | IED selector, GOOSE/sampled-values switch, the two sections, the usage count, what is kept (nothing) | `ied-selector.png`, `lsvs-initially.png` |
| `supervisions.adoc` | The used section: each row, statuses (assigned, missing control block, not subscribed), actions | `supervision-selected.png`, `missing-control-block.png`, `unsubscribed-control-block.png` |
| `assigning.adoc` | Assign, reassign, disconnect, delete, create an empty supervision, create and assign in one step, the limit | `supervision-selected.png`, `at-the-maximum.png` |
| `requirements.adoc` (from `allowing_supervision_modifications.adoc`) | `valImport`/`valKind`, `Services > SupSubscription`, why the plugin is read-only without them | `not-editable.png` |
| `searching.adoc` | Search rules, what each list searches | `search-without-a-match.png` |
| `icons_and_tooltips.adoc` | Every icon and tooltip in a table | — |
| `empty_states.adoc` (or a section of *The screen*) | No IEDs, no supervisions, no assignable control blocks | `without-ieds.png`, `without-supervisions.png`, `all-assigned.png` |
| `support.adoc` | Zulip, issues | — |
| `development.adoc` | One page: clone, `npm i`, `npm start`, lint, build, bundle, test, coverage, screenshot tests and the CI-owned baselines, docs and Antora, release, no LFS | — |

* Every image is a relative symlink:
  `ln -s "../../../../test/screenshots/baseline/<test name>-Chromium.png" <short-name>.png`.
* Each image has a title and alt text that says what it shows.
* Update `docs/partials/base.adoc` with the right plugin name, title, repository,
  issues, demo, bundle and npm URLs.
* Update the orchestrator playbook: repository URL, `start_path: docs`, branch
  `upgrade` until merged, then `[main, v*]`. Fix any xref that uses the old
  component name.
* Verify with Antora 3 + `@antora/lunr-extension` in a scratch folder, from the
  worktree (`branches: HEAD`) and from Git (`worktrees: false`, branch name),
  with `runtime.log.failure_level: warn`.
* Because CI owns the baselines, the symlinks are broken until the
  `update-visual-baselines` run completes. The orchestrator must not build the
  branch before then (the CI docs check enforces this).

---

## 8. Step status

| Step | Description | Status |
|---|---|---|
| 0 | Plan (`docs/plan.md`), questions | **done** |
| 1 | Tooling: `@omicronenergy/oscd-tooling`, ESM, `rootDir: ./src`, remove local configs and Husky, `files`, `.gitattributes`, release-please files, remove stale artifacts, drop the old suite and baselines | done |
| 2 | Foundation: `src/foundation/*`, scl-lib v2, EditV2 actions, unit specs | done |
| 3 | UI: oscd-ui components, scoped elements, `msg()`, theming, sizing, empty states, per-row actions, component specs | in progress |
| 4 | Demo: `oscd-shell`, `demo/plugins.js`, `demo/sample.scd`, open/save menu plugins | pending |
| 5 | Tests: driver and plugin helpers, component specs, screenshot tests, coverage thresholds | pending |
| 6 | CI and release: `test.yml`, `update-visual-baselines.yml`, `release.yml`, delete old workflows, YAML validation | pending |
| 7 | Docs: move to `docs/`, rewrite pages, symlinks, orchestrator playbook, Antora verification | pending |
| 8 | Final checks: lint, tsc, build, test, bundle, pack, legacy grep, empty-file check, demo in Playwright, report | pending |

Every step: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm test`; one
Conventional Commit with only that step's files; update this table and the
worklog.

---

## 9. Worklog

### Step 0 — Plan (done)

* Read the plugin, its fixtures and its tests; the reference repositories
  (`oscd-editor-subscriber-later-binding` for tooling, CI, tests and docs;
  `oscd-editor-subscriber-databinding` is cited by the reference but was not
  needed).
* Confirmed: the `OpenPowerShift/oscd-supervision` URL does not exist; the
  remote is `danyill/oscd-supervision`. `oscd-supervision` is not on npm.
* Confirmed: baselines are normal Git files, not LFS, contrary to the docs.
* Confirmed: 31 screenshot-only tests, 0 assertions, 78 fixed waits.
* Confirmed: `npm pack` would omit `dist/` (no `files`, `/dist` in
  `.gitignore`).
* Found the duplicate `LGOS inst="3"` in `GOOSE_Subscriber4` of the fixture,
  which exposes the identity round-trip in L3.
* No code written. No dependency installed. Branch `upgrade` created from
  `main`.
* Commit `398a2c3 docs: add the upgrade plan`.
* Questions answered 2026-10-19: package `oscd-editor-supervision`; deploy per
  the reference (`gh-pages`); the first supervision in document order cannot be
  deleted; drop the CEM; delete the old baselines and stop using Git LFS; commit
  without signing for now; orchestrator uses `start_path: docs`.

### Step 1 — Tooling and scaffold

**Changed**

* `package.json` — renamed to `oscd-editor-supervision`, ESM (`type: module`),
  `files` field, `oscd` scripts, `@omicronenergy/oscd-tooling` dev dependency,
  `@open-wc/testing` v4 only, `tslib` as a runtime dependency, repository and
  `prepublishOnly`.
* `tsconfig.json` — extends the shared base config, `rootDir: ./src`,
  `outDir: ./dist`.
* `eslint.config.js` — thin extension of the shared config.
* `rollup.config.js` — thin extension of the shared bundle config, keeps the
  `demo/index.deploy.html` copy.
* `.gitattributes` — `test/**/*.png binary`; **Git LFS removed** (`git lfs
  uninstall`).
* `.gitignore` — dropped `custom-elements.json`.
* `release-please-config.json`, `.release-please-manifest.json` — package
  `oscd-editor-supervision`, bootstrap at `7526cd1`.
* Delete: `web-test-runner.config.mjs`, `web-dev-server.config.mjs`, `.husky/`,
  `custom-elements.json`, `oscd-supervision.iml`, `dist/`, `coverage/`,
  `.rollup.cache/`, the old integration suite (`test/integration/`) and all 64
  baselines.
* Moved: `oscd-supervision.ts` → `src/oscd-editor-supervision.ts` (class renamed
  `OscdEditorSupervision`), `foundation/` → `src/foundation/`.
* Added: `src/testing/fixtures.ts`, `src/oscd-editor-supervision.spec.ts` (one
  smoke test, so the suite is non-empty).
* `.githooks/` generated by `oscd install-hooks`.

**Problems found and fixed**

* `npm install` failed in `prepare`: `core.hooksPath` was `.husky` and the
  tooling refuses to overwrite. Removed the setting; `prepare` then installed
  `.githooks`. Local `core.hooksPath` is now `.githooks`.
* The shared ESLint config is stricter than the legacy one (83 problems). The
  one-time reformat diff was applied with `oscd lint --format`, and the five
  remaining errors were fixed by hand (`any` in `debounce` and in the legacy
  filtered list, unused expression in `hideFiltered`). 11 TSDoc warnings remain
  in files that Step 2 and Step 3 rewrite or delete.
* `static styles: CSSResultGroup` in the legacy filtered list does not compile
  because MWC pulls a second copy of Lit (duplicate private `_styleSheet`). Kept
  `static styles: any` with a targeted eslint-disable until that file is
  deleted in Step 3.
* `npm run bundle` fails on the **demo** bundle: `demo/index.html` imports
  `@openscd/open-scd-core`, whose dynamic locale import is not supported by the
  shared Rollup config. The plugin bundle itself is produced. The demo is
  replaced with `oscd-shell` in Step 4, which removes the cause.

**Verification**

| Command | Result |
|---|---|
| `npm install` | pass after clearing `core.hooksPath` |
| `npm run lint` | 0 errors, 11 warnings |
| `npx tsc --noEmit` | pass |
| `npm run build` | pass |
| `npm test` | 1 test, 1.9 s, pass |
| `npm run bundle` | plugin bundle pass; demo bundle fails (see above) |

### Step 2 — Foundation modules

**Added** (`src/foundation/`)

* `control-type.ts` — `ControlType`, `controlTag`, `supervisionLnClass`,
  `supervisionRefName`, `controlTypeName`.
* `sort.ts` — `collator` and `compareNames` with numeric collation (L23).
* `control-block.ts` — reference through scl-lib `controlBlockObjRef`, path,
  name, description, dataset, id, and `controlBlocksOfOtherIeds` (L8, L21).
* `supervision.ts` — nodes, reference (trimmed), path, description,
  `firstSupervisionLn` in document order (Q3), `isSupervisionEditable` through
  scl-lib `isSrcRefEditable`, `isModificationAllowed`, `maxSupervisions`
  (undefined when the IED declares no service), `canCreateSupervision`,
  `canDeleteSupervision`.
* `subscription.ts` — subscribed references resolved by the control block the
  `ExtRef` resolves to, so an `ExtRef` without `serviceType` counts (L9); no
  placeholder values.
* `model.ts` — one `buildModel(doc, ied, controlType)` per document version,
  with `used` / `available` / `controlBlocks` / `assignable` and the counts.
* `actions.ts` — `assignSupervisionEdit` (one edit: `SetTextContent` on the
  existing `Val`, or scl-lib creating the missing `DOI`/`DAI`/`Val`) (L7),
  `createAndAssignSupervisionEdit`, `disconnectSupervisionEdit`,
  `deleteSupervisionEdit`, `createSupervisionLnEdit` (copies `prefix`, chooses
  `inst` within the LDevice, inserts after the last LN) (L10, L11, L12).
* `rows.ts` — `visibleSupervisions`, `visibleControlBlocks` for the search.
* `search.ts` — `getSearchRegex`, tokenizer rewritten so a bare term is not
  merged with a following quoted phrase (L19).
* Specs: `search.spec.ts`, `sort.spec.ts`, `control-block.spec.ts`,
  `supervision.spec.ts`, `model.spec.ts`, `actions.spec.ts`, `rows.spec.ts`.
* `src/testing/fixtures.ts`, `src/testing/scl.ts` (`applyEdit`, `ied`).

**Removed**

* The single smoke spec `src/oscd-editor-supervision.spec.ts` from Step 1. It
  only imported the legacy component, and `@openscd/open-scd-core` keeps the
  browser page alive, which made the runner wait for its finish timeout. A
  component spec returns in Step 3 with the new component.
* `compareNames` and `minAvailableLogicalNodeInstance` from
  `foundation/foundation.ts` were replaced by `sort.ts` and scl-lib
  `lnInstGenerator`; the legacy copies stay temporarily because the legacy
  component imports them (deleted in Step 3).

**Problems found and fixed**

* **A failing `expect(edit).to.equal(null)` hung the test page.** Chai formats
  the actual value for the failure message; formatting an edit that carries an
  SCL `Element` walks the whole document and never returns. Two real defects
  were hiding behind it: `createAndAssignSupervisionEdit` was called without a
  maximum check, and `createSupervisionLnEdit` used scl-lib `getReference`,
  which returns the *first* `LN`, not the position after the last one. Both are
  fixed (`canCreateSupervision` guard, last-LN reference) and the specs assert
  `edit === null` so a failure cannot format a DOM node again.
* `canRemoveSupervision` is not exported from the scl-lib root; editability uses
  the deep import `@openscd/scl-lib/dist/tLN/supervision/foundation.js`
  (`isSrcRefEditable`), like `createElement`.
* `web-test-runner.config.js` extends the shared config (unit group only counts
  for coverage, visual group Chromium with local fonts, `SPEC=...` runs one
  spec). Coverage thresholds are left for Step 5.
* Test suite: `npm test` runs 79 tests in ~3 s. The earlier hangs were the chai
  formatting defect above, not the runner.

**Verification**

| Command | Result |
|---|---|
| `npm run lint` | 0 errors, 11 TSDoc warnings (legacy files, Step 3/7) |
| `npx tsc --noEmit` | pass |
| `npm run build` | pass |
| `npm test` | 79 tests, 3 s, pass, coverage 93.07 % statements |

### Step 3 — User interface

**Replaced**

* `src/oscd-editor-supervision.ts` is now a `ScopedElementsMixin(LitElement)`
  root which owns `doc`, `docName`, `docVersion`, `controlType` and the
  selection, builds the model in `willUpdate`, and dispatches one EditV2 per
  user action with a title. It renders the header (IED selector, name, type,
  GOOSE/sampled-values switch, usage count), a notice when changes are not
  allowed, the used supervisions, and the two assignment lists.
* `src/components/ied-selector.ts` — `OscdFilterButton` with one item per IED.
* `src/components/supervision-table.ts` — one row per used supervision, with
  labelled `oscd-icon-button` actions (L1, L2).
* `src/components/available-supervisions.ts` — search, the selectable rows, the
  "New LGOS/LSVS supervision" entry and the create button.
* `src/components/control-block-list.ts` — search and the assignable control
  blocks; it says "Select a supervision first" until one is chosen.
* `src/theme.ts` — `oscdMd3Mappings` pointed at the internal `--oscd-*` palette.
* All text goes through `msg()`; all tags are registered per component; no
  global `customElements.define` in `src/`.
* Sizing (U1): `:host` is a 100 %-height column, header fixed, `.content`
  flexes and scrolls, so the plugin never overflows its host.
* Theming (U2): `--oscd-theme-*` with Solarized defaults on `:host`, consumed
  as `--oscd-*` and mapped to `--md-sys-color-*`, so light and dark themes work.

**Deleted**

* `src/foundation/components/` (`oscd-filter-button`, `oscd-filtered-list-old`),
  `src/foundation/subscription/subscription.ts`, `src/foundation/icons.ts`, and
  the temporary `compareNames`/`minAvailableLogicalNodeInstance` copies in
  `foundation.ts`.

**Problems found and fixed**

* **Lit attribute bindings on boolean properties.** `canCreate=${false}` and
  `?disabled=${true}` do not do what they look like: `canCreate=${false}` sets
  `cancreate="false"` and the Boolean converter reads any attribute as `true`;
  `?disabled` on the `oscd-list-item`/`oscd-icon-button` hosts was removed by
  the components. The plugin now uses `?canCreate=${...}` for the boolean and
  `.disabled=${...}` for the property.
* `aria-label` on an `oscd-icon-button` is rendered on the internal button, not
  on the host, so specs must not query by it. The action buttons carry
  `data-action="disconnect" | "delete"` and set `.ariaLabel`; the driver and the
  specs query the data attribute.
* eslint flagged `@open-wc/testing` and `@openscd/oscd-editor` in
  `src/testing/**` as dev dependencies; `eslint.config.js` now allows
  devDependencies for test helpers, as the reference does.

**Verification**

| Command | Result |
|---|---|
| `npm run lint` | pass |
| `npx tsc --noEmit` | pass |
| `npm run build` | pass |
| `npm test` | 108 tests, 7.6 s, pass, coverage 94.84 % statements |
| legacy import search in `src/` | no match |

### Step 4–8

To be written as each step completes, with the commit hashes, the exact
commands run and their results, and the problems found. Written so that the same
work can be repeated on a similar plugin.

---

## 10. Questions for you

**Answered 2026-10-19. All seven decisions are applied below and in the plan.**

**Q1. Package name and scope.** The repository is `danyill/oscd-supervision` and
the package is unpublished. Publish as `oscd-supervision` (matches the repo and
the current `name`), or as `@openpowershift/oscd-supervision` (matches the
reference plugins and the `OpenPowerShift/...` URL in the brief)? This sets
`package-name` in `release-please-config.json`, the docs URLs and the npm
trusted-publisher settings.
**Decision: `oscd-editor-supervision`, unscoped.** Entry point
`src/oscd-editor-supervision.ts`, bundle `dist/oscd-editor-supervision.js`. The
repository stays `danyill/oscd-supervision`.

**Q2. Deploy target.** The brief asks for `upload-pages-artifact@v3` +
`deploy-pages@v4` *and* for "GitHub Pages from the `gh-pages` branch". These are
mutually exclusive. The reference repository deploys `dist` to the `gh-pages`
branch with `JamesIves/github-pages-deploy-action@v4`. Keep that (Pages source =
`gh-pages` branch), or switch to Pages-from-Actions (Pages source = GitHub
Actions)? [Recommend keeping `gh-pages`, as the reference does and as the
settings list says.]
**Decision: follow the reference.** `deploy` in `release.yml` uses
`JamesIves/github-pages-deploy-action@v4` to the `gh-pages` branch. No
`deploy-pages`, no separate `deploy.yml`.

**Q3. The "first supervision cannot be deleted" rule.** The rule exists because
scl-lib copies `lnType`/`prefix` from the first supervision LN to create new
ones. Today it blocks the first LN in sort order, which can be the wrong one.
Options: (a) block the last supervision LN of the class in the IED, so a
template always remains and any other LN can be deleted; (b) block the first LN
in document order; (c) allow all deletions and disable creation when no
template remains.
**Decision: (b) the first supervision in document order cannot be deleted.**
This is the LN scl-lib copies `lnType` and `prefix` from. The tooltip names it.
Any other LN can be deleted.

**Q4. `custom-elements.json`.** It is tracked and stale. The reference keeps no
CEM. Keep it (run `oscd analyze` in CI) or drop it and the `customElements`
field?
**Decision: drop.** Delete `custom-elements.json` and the `customElements`
field; do not run `oscd analyze`.

**Q5. Old baselines.** The UI is rewritten, so all 64 baselines and the old
integration suite are obsolete. Delete them in the same commit that adds the new
screenshot tests?
**Decision: yes, and stop using Git LFS.** The old suite and all 64 baselines are
deleted. Baselines are normal Git files (`.gitattributes`: `test/**/*.png
binary`). CI regenerates Chromium-only baselines when the PR gets the
`update-visual-baselines` label.

**Q6. Signing.** You asked me to commit without signing for now. I will use
`git -c commit.gpgsign=false commit` per commit and leave your global
`commit.gpgsign=true` untouched, so the later re-signing is a rebase with signing on.
**Decision: confirmed.** Every commit uses `git -c commit.gpgsign=false`; global
signing stays on for the later re-sign.

**Q7. Documentation orchestrator.** The playbook currently has no `start_path`
for this plugin and uses `danyill/oscd-supervision` with `[main, v*]`. After the
upgrade I will set `start_path: docs` and branch `upgrade` until it is merged.
**Decision: confirmed.** `start_path: docs`, branch `upgrade` until merged, then
`[main, v*]`, repository `danyill/oscd-supervision`.
