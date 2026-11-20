# AlcoGym

A tiny Firefox extension that rebrands [algogym.ru](https://algogym.ru):

- the sidebar/auth logo (purple tile with code brackets) becomes a beer `🍺`
- the wordmark `AlgoGym` becomes `AlcoGym`
- every `algogym` in page text becomes `alcogym` (`algogym.ru` → `alcogym.ru`)
- the browser tab title, meta description and the favicon are replaced too
- the login screen is rewritten: `ПОНЯТЬ. ПРОПИТЬ. ЗАБЫТЬ.`,
  «Алкоголь, который остаётся с вами.» and a fourth feature, «Жёсткий отходняк»

It works with the site's SPA router: new screens and re-renders are rebranded as
they appear, and code editor / textarea content is never touched.

## Load it

### Temporary (for local use)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Pick `manifest.json` in this folder.
4. Reload any open algogym.ru tab.

The extension is removed when Firefox closes. Load it again the same way after a
restart.

### Permanent (unsigned, Firefox Developer Edition / Nightly / ESR)

A prebuilt `alcogym.xpi` is included in this folder. To rebuild it after changes:

```sh
zip -r -FS alcogym.xpi manifest.json content.js popup.html popup.css popup.js icons
```

Then open `about:addons` → gear menu → **Install Add-on From File…** and choose
`alcogym.xpi`. Regular Firefox requires extensions to be signed; use the
Developer Edition/Nightly, or ESR with `xpinstall.signatures.required` set to
`false`, or submit the XPI to [addons.mozilla.org](https://addons.mozilla.org)
for signing.

## Toggle

Click the 🍺 toolbar button to turn the rebranding on or off. The setting is
stored with `browser.storage.local`; disabling it reloads the page to restore
the original branding.

## Permissions

- `storage` — remembers the on/off switch.
- Host access is limited to `algogym.ru`; the content script runs only there.
