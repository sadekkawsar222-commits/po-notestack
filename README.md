# Po Notestack

A quiet digital typewriter for daily writing. Open it and start typing: the line you write sits on a lamp-lit rail, the carriage lamp follows each letter, and everything else gets out of the way.

**Live app:** https://po-notestack.vercel.app

## Features

- Typewriter writing screen: fixed typing line, moving carriage lamp with warm light, crumpled old-paper background, faint ink-mountain watermark
- Typewriter feel: key-strike, space and carriage-return sounds, phone vibration, ink-strike effect (all switchable in Settings)
- Writing check lamp: green = all good, yellow = the word you are typing looks wrong, red = a finished word or sentence has a spelling or grammar slip
- Banglish → বাংলা phonetic typing (Avro-style) with dictionary-ranked suggestions (↑/↓ choose, Enter pick, Esc close). Toggle with the EN/বাং key or Ctrl+Shift+B
- Formatting: bold, italic, underline, strikethrough, H1–H3, alignment, colors, highlight, links, bullet/numbered/check lists, quotes, tables, dividers, code, superscript/subscript
- Documents: auto-save, rename, duplicate, favorites, folders, search, recent, archive, trash and restore
- Export: PDF (A4/A5/Letter, portrait/landscape, margins, font size, page numbers, title), DOCX, Markdown, TXT
- Share: encrypted read-only links (AES-256-GCM, key stays in the link), optional password and expiry
- Themes: Original (lamp-lit paper), Night (solid black and white), Classic Paper; adjustable font, size, spacing, width, cursor
- Focus while typing: menus hide and earlier paragraphs fade; Focus mode keeps them hidden
- Works offline and installs as an app (desktop and phone)

## Run it yourself

It is a static site with no build step.

```bash
git clone <this repo>
cd po-notestack
npx serve .
```

Then open http://localhost:3000. Or deploy the folder to any static host (Vercel, Netlify, GitHub Pages). `vercel.json` sets the security headers on Vercel.

## Install as an app

- **Desktop (Chrome / Edge):** open the live app and press the **install** key in the top bar, or the install icon in the address bar.
- **Android:** open the live app in Chrome → menu → *Install app*. An APK can be generated from the live URL with [PWABuilder](https://www.pwabuilder.com).
- **iPhone / iPad:** open in Safari → Share → *Add to Home Screen*.

## Data and privacy

Documents are stored in your browser only (IndexedDB). There are no accounts and no tracking. See `legal.html` for the full privacy notice, terms and open-source credits.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole app (UI, editor, storage, export, sharing, checker) |
| `bangla.js` | Banglish → Bangla phonetic engine and suggestions |
| `typefx.js` | Typewriter sounds, vibration and strike effect |
| `sw.js` | Offline support |
| `manifest.webmanifest`, `icon-*.png` | App install metadata and icons |
| `vendor/` | Self-hosted libraries (DOMPurify, JSZip, Turndown, Typo.js) |
| `legal.html` | Privacy, terms and credits |
| `vercel.json` | Security headers |

## License

MIT for the Po Notestack code. Bundled libraries, fonts and dictionaries keep their own licenses (listed in `legal.html`).
