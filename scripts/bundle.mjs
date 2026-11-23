#!/usr/bin/env node
/**
 * Swiss Volley / FIVB Matchblatt — Standalone Single-File HTML Bundler
 *
 * Reads index.html, inlines all local CSS stylesheets and JS scripts in exact order,
 * guards Service Worker registration when opened via file://, verifies ZERO external
 * network dependencies (CDNs, fonts, scripts, stylesheets), and writes matchblatt-standalone.html.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

const EXPECTED_CORE_FILES = [
  'index.html',
  'styles/sheet.css',
  'styles/app.css',
  'src/i18n.js',
  'src/engine.js',
  'src/sheet-renderer.js',
  'src/exporter.js',
  'src/app.js'
];

const ALLOWED_XML_NAMESPACES = new Set([
  'http://www.w3.org/2000/svg',
  'http://www.w3.org/1999/xlink',
  'http://www.w3.org/1999/xhtml',
  'http://www.w3.org/XML/1998/namespace',
  'http://www.w3.org/2000/xmlns/'
]);

function extractAttribute(tagAttrs, attrName) {
  const regex = new RegExp(`\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + '`' + `]+))`, 'i');
  const match = tagAttrs.match(regex);
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? null;
}

function hasBooleanAttribute(tagAttrs, attrName) {
  const regex = new RegExp(`(?:^|\\s)${attrName}(?:\\s|=|$)`, 'i');
  return regex.test(tagAttrs);
}

function isExternalUrl(urlStr) {
  if (!urlStr) return false;
  const trimmed = urlStr.trim();
  return /^(?:https?:)?\/\//i.test(trimmed);
}

function normalizeLocalRelPath(rawUrl) {
  const clean = rawUrl.split('#')[0].split('?')[0].trim();
  return clean.replace(/^\.\//, '');
}

function escapeClosingStyleTag(cssContent) {
  return cssContent.replace(/<\/(style)/gi, '<\\/$1');
}

function escapeClosingScriptTag(jsContent) {
  return jsContent.replace(/<\/(script)/gi, '<\\/$1');
}

/**
 * Scans bundled HTML for any external http/https or protocol-relative dependencies,
 * ignoring standard W3C SVG/XML namespace URIs.
 */
export function findExternalDependencies(htmlContent) {
  const issues = [];

  // 1. Check any remaining external or un-inlined <script src="...">
  const scriptSrcRe = /<script\b([^>]*)>/gi;
  let m;
  while ((m = scriptSrcRe.exec(htmlContent)) !== null) {
    const src = extractAttribute(m[1], 'src');
    if (src) {
      issues.push(`Un-inlined <script src="${src}">`);
    }
  }

  // 2. Check any remaining <link rel="stylesheet" href="..."> or external <link href="...">
  const linkRe = /<link\b([^>]*)>/gi;
  while ((m = linkRe.exec(htmlContent)) !== null) {
    const rel = (extractAttribute(m[1], 'rel') || '').toLowerCase();
    const href = extractAttribute(m[1], 'href');
    if (!href) continue;
    if (rel.split(/\s+/).includes('stylesheet')) {
      issues.push(`Un-inlined stylesheet <link href="${href}">`);
    } else if (isExternalUrl(href)) {
      issues.push(`External <link rel="${rel}" href="${href}">`);
    }
  }

  // 3. Check CSS @import and external url(...)
  const importRe = /@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi;
  while ((m = importRe.exec(htmlContent)) !== null) {
    issues.push(`CSS @import dependency: ${m[1]}`);
  }

  const cssUrlRe = /url\(\s*["']?((?:https?:)?\/\/[^"')]+)["']?\s*\)/gi;
  while ((m = cssUrlRe.exec(htmlContent)) !== null) {
    issues.push(`External CSS url() dependency: ${m[1]}`);
  }

  // 4. Scan all literal http:// or https:// occurrences anywhere in the output
  const protoRe = /https?:\/\/[^\s"'<>`)\]}]+/gi;
  while ((m = protoRe.exec(htmlContent)) !== null) {
    const cleaned = m[0].replace(/[.,;:'")\]}]+$/, '');
    if (!ALLOWED_XML_NAMESPACES.has(cleaned)) {
      issues.push(`External URL reference: ${cleaned}`);
    }
  }

  return Array.from(new Set(issues));
}

/**
 * Wraps any inline Service Worker registration so opening matchblatt-standalone.html via file://
 * skips SW registration cleanly while preserving SW behavior on http/https.
 */
function guardServiceWorkerForFileProtocol(htmlContent) {
  // Inject a safe early guard before scripts run so navigator.serviceWorker.register is a no-op on file:
  const swGuardSnippet = [
    '<script data-standalone-sw-guard>',
    '(function () {',
    "  if (typeof location !== 'undefined' && location.protocol === 'file:') {",
    "    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {",
    '      try {',
    '        navigator.serviceWorker.register = function () { return Promise.resolve(null); };',
    '      } catch (_) {}',
    '    }',
    '  }',
    '})();',
    '</script>'
  ].join('\n');

  // Also guard any small inline SW-registration script blocks originally in index.html
  // (never wrap inlined module scripts!)
  const guardedHtml = htmlContent.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (fullMatch, attrs, body) => {
      if (
        extractAttribute(attrs, 'src') ||
        extractAttribute(attrs, 'data-inlined') ||
        extractAttribute(attrs, 'data-inlined-src') ||
        hasBooleanAttribute(attrs, 'data-standalone-sw-guard')
      ) {
        return fullMatch;
      }
      if (!body.includes('serviceWorker') || !body.includes('.register')) {
        return fullMatch;
      }
      // Wrap inline SW registration block in a file: protocol guard + safe catch
      const wrappedBody = [
        '(function () {',
        "  if (typeof location !== 'undefined' && location.protocol === 'file:') return;",
        '  try {',
        body,
        '  } catch (_) {}',
        '})();'
      ].join('\n');
      return `<script${attrs}>\n${wrappedBody}\n</script>`;
    }
  );

  if (/<head\b[^>]*>/i.test(guardedHtml)) {
    return guardedHtml.replace(/<head\b([^>]*)>/i, (tag) => `${tag}\n${swGuardSnippet}`);
  }
  return `${swGuardSnippet}\n${guardedHtml}`;
}

/**
 * Bundles index.html + local CSS + local JS into matchblatt-standalone.html.
 */
export function bundleMatchblatt(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.env.MATCHBLATT_ROOT || DEFAULT_ROOT);
  const outFile = path.resolve(options.outFile || path.join(rootDir, 'matchblatt-standalone.html'));
  const strict = Boolean(options.strict);
  const quiet = Boolean(options.quiet);

  const log = quiet ? () => {} : (msg) => console.log(msg);

  // Step 1: Check core files status gracefully
  const presentFiles = [];
  const missingCoreFiles = [];
  for (const rel of EXPECTED_CORE_FILES) {
    const abs = path.join(rootDir, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      presentFiles.push(rel);
    } else {
      missingCoreFiles.push(rel);
    }
  }

  const indexPath = path.join(rootDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log('[bundle] Cannot build matchblatt-standalone.html yet — index.html is not present.');
    log(`[bundle] Present (${presentFiles.length}/${EXPECTED_CORE_FILES.length}): ${presentFiles.join(', ') || 'none'}`);
    log(`[bundle] Missing (${missingCoreFiles.length}/${EXPECTED_CORE_FILES.length}): ${missingCoreFiles.join(', ')}`);
    if (strict) {
      throw new Error(`Missing required files: ${missingCoreFiles.join(', ')}`);
    }
    return { built: false, missing: missingCoreFiles, present: presentFiles, outFile: null };
  }

  let html = fs.readFileSync(indexPath, 'utf8');

  // Discover all local stylesheet and script references in index.html
  const discoveredMissing = new Set(missingCoreFiles);

  const linkTagRe = /<link\b([^>]*)>/gi;
  let match;
  while ((match = linkTagRe.exec(html)) !== null) {
    const attrs = match[1];
    const rel = (extractAttribute(attrs, 'rel') || '').toLowerCase();
    const href = extractAttribute(attrs, 'href');
    if (!href) continue;
    if (isExternalUrl(href)) {
      throw new Error(`External <link> dependency forbidden in offline build: ${href}`);
    }
    if (rel.split(/\s+/).includes('stylesheet')) {
      const localRel = normalizeLocalRelPath(href);
      const localAbs = path.resolve(rootDir, localRel);
      if (!fs.existsSync(localAbs)) {
        discoveredMissing.add(localRel);
      }
    }
  }

  const scriptTagRe = /<script\b([^>]*)>\s*<\/script>/gi;
  while ((match = scriptTagRe.exec(html)) !== null) {
    const attrs = match[1];
    const src = extractAttribute(attrs, 'src');
    if (!src) continue;
    if (isExternalUrl(src)) {
      throw new Error(`External <script> dependency forbidden in offline build: ${src}`);
    }
    const localRel = normalizeLocalRelPath(src);
    const localAbs = path.resolve(rootDir, localRel);
    if (!fs.existsSync(localAbs)) {
      discoveredMissing.add(localRel);
    }
  }

  if (discoveredMissing.size > 0) {
    const missingList = Array.from(discoveredMissing);
    log('[bundle] Waiting for remaining project files before writing matchblatt-standalone.html:');
    for (const rel of EXPECTED_CORE_FILES) {
      const status = discoveredMissing.has(rel) ? 'MISSING' : 'OK     ';
      log(`  [${status}] ${rel}`);
    }
    for (const extra of missingList) {
      if (!EXPECTED_CORE_FILES.includes(extra)) {
        log(`  [MISSING] ${extra}`);
      }
    }
    if (strict) {
      throw new Error(`Cannot bundle; missing files: ${missingList.join(', ')}`);
    }
    return { built: false, missing: missingList, present: presentFiles, outFile: null };
  }

  // Step 2: Inline all local stylesheets and omit external/file-unsafe manifest links
  const inlinedStyles = [];
  html = html.replace(/<link\b([^>]*)>/gi, (fullTag, attrs) => {
    const relTokens = (extractAttribute(attrs, 'rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
    const href = extractAttribute(attrs, 'href');
    if (!href) return fullTag;

    if (relTokens.includes('stylesheet')) {
      const localRel = normalizeLocalRelPath(href);
      const localAbs = path.resolve(rootDir, localRel);
      const cssRaw = fs.readFileSync(localAbs, 'utf8');
      const safeCss = escapeClosingStyleTag(cssRaw);
      inlinedStyles.push(localRel);
      return `<style data-inlined="${localRel}">\n${safeCss}\n</style>`;
    }

    if (relTokens.includes('manifest')) {
      return '<!-- manifest link omitted in standalone single-file HTML -->';
    }

    return fullTag;
  });

  // Step 3: Inline all local <script ... src="..."></script>
  // Note: In HTML5, inline <script> ignores the `defer` attribute. If <script defer src="...">
  // was placed inside <head>, relocate those deferred scripts in exact order to right before </body>
  // so DOM elements in <body> exist before execution (matching native `defer` behavior).
  const inlinedScripts = [];
  const deferredFromHead = [];

  const headEndIdx = html.search(/<\/head>/i);
  if (headEndIdx !== -1) {
    const headPart = html.slice(0, headEndIdx);
    const restPart = html.slice(headEndIdx);

    const processedHead = headPart.replace(/<script\b([^>]*)>\s*<\/script>/gi, (fullTag, attrs) => {
      const src = extractAttribute(attrs, 'src');
      if (!src) return fullTag;
      const localRel = normalizeLocalRelPath(src);
      const localAbs = path.resolve(rootDir, localRel);
      const jsRaw = fs.readFileSync(localAbs, 'utf8');
      const safeJs = escapeClosingScriptTag(jsRaw);
      inlinedScripts.push(localRel);

      const inlineBlock = `<script data-inlined="${localRel}">\n${safeJs}\n</script>`;
      if (hasBooleanAttribute(attrs, 'defer')) {
        deferredFromHead.push(inlineBlock);
        return `<!-- deferred script ${localRel} relocated to end of body -->`;
      }
      return inlineBlock;
    });

    const processedRest = restPart.replace(/<script\b([^>]*)>\s*<\/script>/gi, (fullTag, attrs) => {
      const src = extractAttribute(attrs, 'src');
      if (!src) return fullTag;
      const localRel = normalizeLocalRelPath(src);
      const localAbs = path.resolve(rootDir, localRel);
      const jsRaw = fs.readFileSync(localAbs, 'utf8');
      const safeJs = escapeClosingScriptTag(jsRaw);
      inlinedScripts.push(localRel);
      return `<script data-inlined="${localRel}">\n${safeJs}\n</script>`;
    });

    html = processedHead + processedRest;
  } else {
    html = html.replace(/<script\b([^>]*)>\s*<\/script>/gi, (fullTag, attrs) => {
      const src = extractAttribute(attrs, 'src');
      if (!src) return fullTag;
      const localRel = normalizeLocalRelPath(src);
      const localAbs = path.resolve(rootDir, localRel);
      const jsRaw = fs.readFileSync(localAbs, 'utf8');
      const safeJs = escapeClosingScriptTag(jsRaw);
      inlinedScripts.push(localRel);
      return `<script data-inlined="${localRel}">\n${safeJs}\n</script>`;
    });
  }

  if (deferredFromHead.length > 0) {
    const deferredBundle = deferredFromHead.join('\n');
    const lowerHtml = html.toLowerCase();
    const bodyCloseIdx = lowerHtml.lastIndexOf('</body>');
    if (bodyCloseIdx !== -1) {
      html = `${html.slice(0, bodyCloseIdx)}${deferredBundle}\n${html.slice(bodyCloseIdx)}`;
    } else {
      html += `\n${deferredBundle}`;
    }
  }

  // Step 4: Guard Service Worker registration only when location.protocol === 'file:'
  html = guardServiceWorkerForFileProtocol(html);

  // Step 5: Verify ZERO external dependencies
  const externalIssues = findExternalDependencies(html);
  if (externalIssues.length > 0) {
    throw new Error(
      `Standalone bundle failed zero-external-dependency check:\n  - ${externalIssues.join('\n  - ')}`
    );
  }

  // Step 6: Write standalone single-file HTML
  fs.writeFileSync(outFile, html, 'utf8');
  const sizeKB = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  log(
    `[bundle] Built ${outFile} (${sizeKB} KB) — ` +
    `inlined ${inlinedStyles.length} stylesheet(s) [${inlinedStyles.join(', ')}] and ` +
    `${inlinedScripts.length} script(s) [${inlinedScripts.join(', ')}]; 0 external dependencies.`
  );

  return {
    built: true,
    missing: [],
    inlinedStyles,
    inlinedScripts,
    bytes: Buffer.byteLength(html, 'utf8'),
    outFile
  };
}

// Run when invoked directly via `node scripts/bundle.mjs`
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === __filename) {
  const args = process.argv.slice(2);
  let rootDir = DEFAULT_ROOT;
  let outFile = null;
  let strict = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root' && args[i + 1]) {
      rootDir = args[++i];
    } else if (args[i] === '--out' && args[i + 1]) {
      outFile = args[++i];
    } else if (args[i] === '--strict') {
      strict = true;
    }
  }

  try {
    bundleMatchblatt({ rootDir, outFile, strict });
  } catch (err) {
    console.error(`[bundle] ERROR: ${err.message}`);
    process.exitCode = 1;
  }
}
