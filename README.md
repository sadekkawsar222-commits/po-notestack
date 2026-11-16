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
- Optional accounts: sign in with Google or an email link to sync notes across all your devices; keep writing offline and it syncs when you reconnect
- Word-style tools: sheets with formulas (SUM, AVERAGE, MIN, MAX…), table editing, pictures, fonts, sizes, line spacing, page breaks, find & replace
- Typing practice game: 12 stages (home row to marathon), word-rain mode, stars and unlocks, weak-key workouts built from your mistakes, speed history. Open with the practice key, Ctrl+Shift+G, or /#practice
- Grammar and sentence suggestions: finish a sentence and a corrected version appears under the rail (Apply with Alt+Enter, Ignore with Esc). ✓ check in Aa (Ctrl+Shift+K) checks the whole document. Works offline; optional LanguageTool mode in Settings for deeper online checks
- Writing insights: words today, streak, 14-day chart, typing speed, readability, overused words, suggestions
- Works offline and installs as an app (desktop, tablet and phone)

## Run it yourself

It is a static site with no build step.

```bash
git clone <this repo>
cd po-notestack
npx serve .
```

Then open http://localhost:3000. Or deploy the folder to any static host (Vercel, Netlify, GitHub Pages). `vercel.json` sets the security headers on Vercel.

## Install as an app

- **Windows / Mac / Linux (Chrome or Edge):** open the live app and press the **install** key in the top bar, or the install icon in the address bar.
- **Android (APK):** download [Po-Notestack.apk](https://po-notestack.vercel.app/release/Po-Notestack.apk) (also in `release/`), open it and allow *Install unknown apps* when asked. Needs Android 7.0 or newer. Or open the live app in Chrome → menu → *Install app*.
- **iPhone / iPad:** open in Safari → Share → *Add to Home Screen*.

## Data and privacy

Without an account, documents stay in your browser (IndexedDB). Signing in (Google or email link) is optional and syncs your notes across devices through Supabase, protected by row-level security so each account sees only its own notes. No ads or tracking. See `legal.html` for the full privacy notice, terms and open-source credits.

## Self-hosting with your own sync backend

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. In Authentication → URL Configuration set the Site URL to your app address; enable the Google provider if you want Google sign-in.
3. Put your project URL and publishable key at the top of `sync.js`, and add the project URL to `connect-src` in `vercel.json`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page layout and styles |
| `bangla.js` | Banglish → Bangla phonetic engine and suggestions |
| `typefx.js` | Typewriter sounds, vibration and strike effect |
| `sw.js` | Offline support |
| `app.js` | Editor, storage, export, sharing, spelling lights |
| `sync.js` | Accounts and cloud sync |
| `insights.js` | Writing insights panel |
| `office.js` | Sheets, tables, pictures, fonts, find & replace |
| `game.js` | Typing practice game |
| `grammar.js` | Grammar and sentence suggestions |
| `supabase/schema.sql` | Database table and security rules |
| `release/Po-Notestack.apk` | Android app (phones and tablets) |
| `manifest.webmanifest`, `icon-*.png` | App install metadata and icons |
| `vendor/` | Self-hosted libraries (DOMPurify, JSZip, Turndown, Typo.js, supabase-js) |
| `legal.html` | Privacy, terms and credits |
| `vercel.json` | Security headers |

## License

MIT for the Po Notestack code. Bundled libraries, fonts and dictionaries keep their own licenses (listed in `legal.html`).
