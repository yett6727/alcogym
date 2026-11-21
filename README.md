# AlcoGym

A tiny Firefox extension that rebrands [algogym.ru](https://algogym.ru):
1. New jokes for the login page
2. New icons and title
3. Editor in training is 2x times bigger
4. The top bar in training always follows the screen
5. 2% chance to load site with 'Pacifico' font

## Load it

The extension is unsigned yet, but you can load it for debugging use. It may require re-adding extension on restart.

### Chromium

Go to `chrome://extensions` and click 'Developer mode' in top-right corner. Then choose 'Load from file' and choose project directory.

### Firefox

#### Temporary (for local use)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Pick `manifest.json` in this folder.
4. Reload any open algogym.ru tab.

The extension is removed when Firefox closes. Load it again the same way after a
restart.

#### Permanent (unsigned, Firefox Developer Edition / Nightly / ESR)

For firefox ESR go to `about:config` and change `xpinsstall.signatures.required` to `false`.

Then open `about:addons` → gear menu → **Install Add-on From File…** and choose
`alcogym.xpi`.

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
