# Volleyball Matchblatt — Swiss Volley / FIVB Scoresheet

**100% Offline Web App for the Official Swiss Volley / FIVB International Volleyball Game Report (*Grosses Matchblatt*)**  
**100% Offline-Web-App für das offizielle Swiss Volley / FIVB Spielprotokoll (*Grosses Matchblatt*)**

- **Live Web App (GitHub Pages):** [https://jendelel.github.io/volleyball-matchblatt/](https://jendelel.github.io/volleyball-matchblatt/)
- **Single-File Offline Download (`matchblatt-standalone.html`):** [https://jendelel.github.io/volleyball-matchblatt/matchblatt-standalone.html](https://jendelel.github.io/volleyball-matchblatt/matchblatt-standalone.html)

Zero backend, zero external CDNs or fonts — runs completely locally in any modern mobile, tablet, foldable, or desktop browser (`https://`, `http://`, or `file://`).

---

## Offline Usage on iPhone, iPad & Android / Offline-Nutzung auf Smartphone & Tablet

### Progressive Web App (PWA) — Recommended / Empfohlen
1. Open **[https://jendelel.github.io/volleyball-matchblatt/](https://jendelel.github.io/volleyball-matchblatt/)** once while online so the built-in Service Worker (`sw.js`) caches the entire app locally.
   *Öffne die Live-URL einmalig mit Internetverbindung – der integrierte Service Worker (`sw.js`) speichert die gesamte App lokal im Browser-Cache.*
2. **iPhone / iPad (Safari):** Tap **Share** (`↑`) → **Add to Home Screen** (*Zum Home-Bildschirm*).
3. **Android (Chrome):** Tap the **Menu** (`⋮`) → **Add to Home screen / Install app** (*Zum Startbildschirm hinzufügen / App installieren*).
4. Launch **Matchblatt** from your home screen in airplane mode in any sports hall — all match state is persisted automatically in `localStorage`.

### Single-File Standalone HTML (`matchblatt-standalone.html`)
- Download [`matchblatt-standalone.html`](./matchblatt-standalone.html) onto any laptop, tablet, or USB stick and open it directly from disk (`file://`) with zero setup or server required.
- *Lade [`matchblatt-standalone.html`](./matchblatt-standalone.html) herunter und öffne die Datei direkt lokal (`file://`) – alle Stylesheets und Skripte sind in einer einzigen HTML-Datei eingebettet.*

---

## Features / Funktionen (Swiss Volley & FIVB *Grosses Matchblatt*)

- **1:1 Official Scoresheet Layout (*Grosses Matchblatt*):** Faithful trilingual Swiss Volley / FIVB layout (`DE / FR / IT` sheet headers + bilingual `DE / EN` scorer UI) including Sets 1–4, Deciding Set 5 (3-panel court change layout), Sanctions, Remarks, Set Results summary, Team A/B rosters (up to 14 players + 2 Liberos + Officials `C / AC1 / AC2 / P / M`), Approvals, and Signatures.
- **Automated Rotations & Service Tracking:** Tracks starting lineups (`I–VI`), active server, automatic side-out rotation, slashed running points (`1–48`), and service-turn exit scores in the exact `I–VI` service boxes.
- **Deciding Set 8-Point Court Switch:** Automatically handles the 3-panel deciding set layout (`Left | Right | Far-Right`), records pre-switch points at 8 points, swaps courts seamlessly, and continues scoring without losing pre-switch history.
- **Substitutions, Timeouts & Sanctions with Override:** Enforces FIVB / Swiss Volley limits (max 6 team substitutions per set, player re-entry rules, max 2 timeouts per set, delay & misconduct warnings/penalties/expulsions/disqualifications) with clear rule warnings and **Ref Override / Exceptional Substitution** support.
- **Tap-to-Edit Cells & Full Set Zoom:** Switch between **Current Set Zoom** (optimized for phone & foldable screens) and **Full Sheet View**, plus direct **Manual Cell Edit** mode to annotate or adjust any cell on the scoresheet.
- **Touch Signatures:** Built-in touch/stylus signature pad for Pre-/Post-Match Captains, Coaches, Scorer, Assistant Scorer, and 1st & 2nd Referees.
- **100% Offline A4 Landscape PDF & High-DPI PNG Export:** Generates print-ready A4 landscape PDFs, crisp high-DPI PNG images, and full JSON match backups directly in the browser with zero server calls.
- **Unlimited Undo / Redo & Auto-Save:** Immutable action history persisted in `localStorage` (`matchblatt_doc_v1`) so accidental taps or page reloads never lose a rally.

---

## Development, Testing & Bundling / Entwicklung & Tests

Requires **Node.js 18+** (zero `npm install` packages needed).

```bash
# Rebuild the single-file offline bundle (matchblatt-standalone.html)
node scripts/bundle.mjs

# Run core scoring engine & FIVB/Swiss Volley rules unit tests
node tests/engine.test.mjs

# Run SVG sheet renderer, standalone bundle & offline PDF/PNG exporter tests
node tests/export.test.mjs

# Run headless Chrome end-to-end & multi-viewport tests
node tests/browser-e2e.mjs
```

### Project Structure

| Path | Description |
| :--- | :--- |
| [`index.html`](./index.html) | App entry point for GitHub Pages / PWA |
| [`manifest.json`](./manifest.json), [`sw.js`](./sw.js) | Offline PWA manifest & cache-first Service Worker |
| [`matchblatt-standalone.html`](./matchblatt-standalone.html) | Self-contained single-file offline HTML build |
| [`src/i18n.js`](./src/i18n.js) | Bilingual (`de` / `en`) UI dictionary |
| [`src/engine.js`](./src/engine.js) | Immutable match state machine, rules validator & Undo/Redo store |
| [`src/sheet-renderer.js`](./src/sheet-renderer.js) | 1:1 Swiss Volley / FIVB SVG scoresheet renderer |
| [`src/exporter.js`](./src/exporter.js) | Zero-dependency offline A4 PDF & high-DPI PNG exporter |
| [`src/app.js`](./src/app.js) | Responsive scorer UI, live controls, modals & signature pad |
| [`styles/`](./styles/) | Scoresheet (`sheet.css`) & responsive UI (`app.css`) styles |
| [`scripts/bundle.mjs`](./scripts/bundle.mjs) | Single-file HTML bundler & zero-external-URL verifier |
| [`tests/`](./tests/) | Automated unit, export & headless browser E2E test suites |
