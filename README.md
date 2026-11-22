# AlcoGym

A tiny Firefox extension that rebrands [algogym.ru](https://algogym.ru):
1. New jokes for the login page
2. New icons and title
3. Editor in training is 2x times bigger
4. The top bar in training always follows the screen
5. 2% chance to load site with 'Pacifico' font

## Install it

You can install signed version from addons.mozilla.org or you can download unsigned version here.

## Load it

The extension is unsigned yet, but you can load it for debugging use. It may require re-adding extension on restart.

### Chromium

Go to `chrome://extensions` and click 'Developer mode' in top-right corner. Then choose 'Load from file' and choose project directory.

### Firefox

Regular Firefox cannot install an unsigned `.xpi` at all — that preference is
locked to `true` there. Use one of the two options below.

#### Temporary (any Firefox, no signature needed)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Pick `manifest.json` in this folder (not the `.xpi`).
4. Reload any open algogym.ru tab.

The extension is removed when Firefox closes. Load it again the same way after a
restart.

#### Permanent (unsigned, Firefox Developer Edition / Nightly / ESR)

1. Go to `about:config` and set **`xpinstall.signatures.required`** to `false`.
   (The correct spelling matters: `xpinstall`, not `xpinsstall`.)
2. Open `about:addons` → gear menu → **Install Add-on From File…** and choose
   `alcogym.xpi` from this folder.

Do **not** install by clicking the release-asset download link: link installs
land in a disabled state. If you already did that, restart Firefox (or enable
AlcoGym in `about:addons`), then reload the algogym.ru tab.

If it still does nothing:
- make sure AlcoGym is enabled in `about:addons`, and the 🍺 popup toggle is **On**;
- remove any older AlcoGym build with a different ID before reinstalling;
- check the Browser Console (`Ctrl+Shift+J`) for content-script errors.

## Toggle

Click the 🍺 toolbar button to turn the rebranding on or off. The setting is
stored with `browser.storage.local`; disabling it reloads the page to restore
the original branding.

## Recompiling

A prebuilt `alcogym.xpi` is included in this folder or in releases tab. To rebuild it after changes:

```sh
zip -r -FS alcogym.xpi manifest.json content.js popup.html popup.css popup.js icons
```

## Permissions

- `storage` — remembers the on/off switch.
- Host access is limited to `algogym.ru`; the content script runs only there.
