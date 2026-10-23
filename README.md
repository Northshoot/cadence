# Teleprompt Your Way

**A gift to humanity from TrainYourWay AI.**

A free, open-source teleprompter for talks, lessons, stories, meditations, and anything you want to say. Warm olive tones, generous type, and a calm reading experience. No account, subscription, AI service, microphone, or recording permission required.

[Open Teleprompt Your Way](https://northshoot.github.io/cadence/) · [TrainYourWay AI](https://trainyourway.ai/) · [MIT license](LICENSE)

## Your words, your rhythm

- A playful pirate demo welcomes fresh users with word highlighting, timed pauses, and optional stage directions. Saved scripts and drafts are preserved.
- Choose **New script** to paste a script or import plain text / JSON. The demo remains available in the script picker; editing it saves a separate personal copy.
- Word-by-word highlighting at 60–240 WPM, with pause/resume and timing continuity when pace changes.
- Countdown, text size, section navigation, progress, focus/full-screen, and mirror mode.
- Explicit timed pauses and optional silent breathing cues; generic scripts need no breathing instructions.
- Keyboard controls, responsive phone/tablet/desktop layouts, and reduced-motion styling.
- Local script library and drafts, with JSON/text export for backups.
- A conversion popup: paste source material, then copy the complete formatting prompt for an assistant of your choice. Material stays on the page; this app makes no AI request.
- Bookmark help for desktop and mobile browsers.

The app provides a paced visual guide. It does not listen, record, or track the words you actually say. WPM timing is estimated; an explicit cue duration overrides that estimate.

## Run locally

Requires Node.js 20+ for tests and Python 3 for the small local server. There are no npm dependencies or build steps.

```sh
npm test
npm start
```

Open `http://127.0.0.1:4390`. Serve `dist/` over HTTP rather than opening the HTML as a file. Every app asset uses relative paths, so the site works beneath the GitHub Pages `/cadence/` path and other static-host subdirectories.

## Read and edit

Choose **New script**, paste your words, and save. Blank lines create spoken paragraphs; `# Heading` starts a section. Standalone directions use:

```text
# Opening
Hello everyone. Welcome to the next chapter.

[pause 3s]

[stage: Show the next slide]

Here is the next thing I want to share.
```

Directions are silent. Unknown bracket text remains narration. For structured editing, choose **Structured JSON**. Only `speak.text` is narration; titles, notes, and other cue types are display information.

Use **Get conversion prompt** to format existing material with an assistant you choose. Paste material into the popup and choose **Copy full prompt**. Original words and line breaks are preserved. If the browser prevents automatic copying, use **Select full prompt** and its manual-copy instructions. Closing the popup keeps material in page memory; closing or reloading the page discards it. Leave material blank for a reusable template.

The complete [JSON schema](dist/script.schema.json), [conversion prompt](dist/conversion-prompt.txt), and [generic example](dist/generic-example.json) are included. Version 1 scripts have unique stable IDs, a title, ordered sections, and ordered cues of type `speak`, `pause`, `stage`, or `breath`. At least one spoken word is required. The runtime also enforces aggregate and cross-field limits beyond the schema.

## Controls

| Control | Action |
| --- | --- |
| Space | Begin, pause, resume |
| Left / right | Previous / next cue |
| Up / down | Slower / faster |
| R | Restart |
| F / Escape | Focus / exit focus |
| M | Mirror |
| ? | Keyboard help |

Shortcuts do not intercept typing or form controls. Switching tabs pauses reading. Native fullscreen availability depends on the browser.

Full pause mode preserves exact supplied durations. Short-pause mode uses up to two seconds per marked pause for a recording workflow; the original durations remain available for editing. Speech rehearsal skips pauses. These modes do not record audio. Optional breath cues remain off until enabled and apply only where explicitly authored.

## Privacy and input handling

Scripts and drafts stay in the browser's local storage. There is no backend, analytics, or cloud synchronization. Export JSON to keep a backup or move work between devices. Localhost, GitHub Pages, and other hosts have separate browser storage. Browser storage is not encrypted by this app, and clearing browser data can remove saved work.

All scripts, metadata, imports, and local storage are treated as untrusted. The app renders text DOM nodes and never interprets pasted HTML, SVG, JavaScript, or Markdown as executable content. It does not fetch user-supplied URLs. A Content Security Policy adds another boundary. Strict allowlisted fields/types, finite timing, reserved-key rejection, depth/size bounds, and recovery handling protect the input paths covered by the regression tests.

Script limits: 1 MB, 100 sections, 2,000 cues, 12,000 characters per cue, 200,000 total cue-text characters, 20,000 spoken words, 3,600 seconds per cue, and eight hours at the slowest pace. Conversion material is limited to 200,000 UTF-16 text units and 1 MB UTF-8. Invalid imports and oversized pastes preserve existing work. Invalid saved data is retained for recovery rather than silently replaced.

These protections are not a guarantee against all browser vulnerabilities or malicious extensions. A formatting prompt does not guarantee that an external model will ignore instructions embedded in supplied material. Review generated scripts before using them. User-supplied material retains its own ownership and licensing.

## Deploy

The GitHub Actions workflow runs tests, uploads only `dist/`, and deploys the successful artifact to GitHub Pages. Pull requests run tests without deployment. Official actions are pinned to immutable commits; publishing permissions are limited to the deployment job. No account token or secret is stored in this repository.

For a fork, enable Pages with **GitHub Actions** as its source, then run the workflow. Update the README, schema URL, and source/license links for your fork as appropriate. Any static HTTP host can serve `dist/`.

## Contribute and share

Use, modify, translate, improve, and share it. Small, thoughtful contributions are welcome through GitHub issues and pull requests. Please avoid including private scripts or browser-storage exports in public reports.

## License and attribution

Copyright (c) 2026 TrainYourWay AI. Project-owned code and documentation are released under the standard [MIT license](LICENSE). Preserve the copyright and permission notice when distributing copies or substantial portions. See [third-party notices](THIRD_PARTY_NOTICES.md) for system fonts, development tools, and external CI components; they are not relicensed by this project.
