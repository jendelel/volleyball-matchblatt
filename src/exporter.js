/**
 * Swiss Volley / FIVB Matchblatt — 100% Offline Exporter (PNG, PDF-1.4, Web Share, JSON Backup)
 * Zero external libraries or CDNs. Runs in browsers (http/https/file) and Node.js.
 */
(function (root) {
  'use strict';

  var DEFAULT_CANVAS_WIDTH = 4210;   // 1684 * 2.5 (Ultra-HD 2.5x ~360 DPI A4 Landscape; 12.5MP < iOS Safari 16.77MP limit)
  var DEFAULT_CANVAS_HEIGHT = 2975;  // 1190 * 2.5 (Ultra-HD 2.5x ~360 DPI A4 Landscape)
  var FALLBACK_CANVAS_WIDTH = 3368;  // 1684 * 2
  var FALLBACK_CANVAS_HEIGHT = 2380; // 1190 * 2
  var A4_LANDSCAPE_WIDTH_PT = 841.89;
  var A4_LANDSCAPE_HEIGHT_PT = 595.28;
  var PDF_MARGIN_PT = 12;

  /**
   * Unwraps either a full Engine store doc ({ state, past, future }) or a plain state object.
   */
  function unwrapState(stateOrDoc) {
    if (
      stateOrDoc &&
      typeof stateOrDoc === 'object' &&
      stateOrDoc.state &&
      typeof stateOrDoc.state === 'object'
    ) {
      return stateOrDoc.state;
    }
    return stateOrDoc;
  }

  /**
   * Transliterates common German/French diacritics and sanitizes filename segments.
   */
  function sanitizeFilenamePart(text, fallback) {
    if (!text || typeof text !== 'string') return fallback;
    var mapped = text
      .replace(/ä/g, 'ae').replace(/Ä/g, 'Ae')
      .replace(/ö/g, 'oe').replace(/Ö/g, 'Oe')
      .replace(/ü/g, 'ue').replace(/Ü/g, 'Ue')
      .replace(/ß/g, 'ss')
      .replace(/[éèêë]/g, 'e').replace(/[ÉÈÊË]/g, 'E')
      .replace(/[àâ]/g, 'a').replace(/[ÀÂ]/g, 'A')
      .replace(/[îï]/g, 'i').replace(/[ÎÏ]/g, 'I')
      .replace(/[ô]/g, 'o').replace(/[Ô]/g, 'O')
      .replace(/[ùû]/g, 'u').replace(/[ÙÛ]/g, 'U')
      .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    var cleaned = mapped
      .replace(/[^a-zA-Z0-9-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    return cleaned || fallback;
  }

  function ensureExtension(filename, ext) {
    var cleanExt = String(ext || '').replace(/^\./, '').toLowerCase();
    if (!filename || typeof filename !== 'string') {
      return 'Matchblatt.' + cleanExt;
    }
    var trimmed = filename.trim();
    if (!trimmed) return 'Matchblatt.' + cleanExt;
    var lower = trimmed.toLowerCase();
    if (lower.endsWith('.' + cleanExt)) return trimmed;
    return trimmed + '.' + cleanExt;
  }

  /**
   * Generates a descriptive default filename such as:
   * Matchblatt_Volley_Koeniz_vs_VBC_Zuerich_2026-11-23.pdf
   */
  function buildDefaultFilename(stateOrDoc, ext) {
    var cleanExt = String(ext || 'pdf').replace(/^\./, '').toLowerCase();
    var state = typeof stateOrDoc === 'string' ? null : unwrapState(stateOrDoc);
    var teamA = sanitizeFilenamePart(
      state && state.teams && state.teams.A && (state.teams.A.name || state.teams.A.shortName),
      'TeamA'
    );
    var teamB = sanitizeFilenamePart(
      state && state.teams && state.teams.B && (state.teams.B.name || state.teams.B.shortName),
      'TeamB'
    );
    var rawDate = (state && state.meta && state.meta.date) || '';
    var datePart = '';
    if (typeof rawDate === 'string' && rawDate.trim()) {
      // Normalize DD.MM.YYYY to YYYY-MM-DD if needed
      var dmy = rawDate.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (dmy) {
        datePart = dmy[3] + '-' + dmy[2] + '-' + dmy[1];
      } else {
        datePart = sanitizeFilenamePart(rawDate.trim(), '');
      }
    }
    if (!datePart) {
      var now = new Date();
      var yyyy = String(now.getFullYear());
      var mm = String(now.getMonth() + 1).padStart(2, '0');
      var dd = String(now.getDate()).padStart(2, '0');
      datePart = yyyy + '-' + mm + '-' + dd;
    }
    return 'Matchblatt_' + teamA + '_vs_' + teamB + '_' + datePart + '.' + cleanExt;
  }

  /**
   * Resolves (filename, options) arguments flexibly when filename is omitted or options is 2nd arg.
   */
  function normalizeFileAndOptions(stateOrDoc, filenameOrOptions, maybeOptions, ext) {
    var filename = null;
    var options = maybeOptions || {};
    if (typeof filenameOrOptions === 'string') {
      filename = filenameOrOptions;
    } else if (filenameOrOptions && typeof filenameOrOptions === 'object') {
      options = filenameOrOptions;
      if (typeof options.filename === 'string') {
        filename = options.filename;
      }
    }
    var resolvedName = ensureExtension(
      filename || buildDefaultFilename(stateOrDoc, ext),
      ext
    );
    return { filename: resolvedName, options: options };
  }

  /**
   * Encodes a UTF-8 string into Base64 safely across Node.js and all modern browsers.
   */
  function utf8ToBase64(str) {
    if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
      return Buffer.from(str, 'utf8').toString('base64');
    }
    if (typeof TextEncoder !== 'undefined' && typeof btoa === 'function') {
      var bytes = new TextEncoder().encode(str);
      var binary = '';
      var chunkSize = 0x8000;
      for (var i = 0; i < bytes.length; i += chunkSize) {
        var slice = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, slice);
      }
      return btoa(binary);
    }
    if (typeof btoa === 'function') {
      return btoa(unescape(encodeURIComponent(str)));
    }
    throw new Error('No Base64 encoder available in this environment.');
  }

  /**
   * Decodes a data:...;base64,... or percent-encoded data URL into a raw Uint8Array.
   */
  function dataURLToUint8Array(dataUrl) {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      throw new Error('Invalid data URL provided to dataURLToUint8Array.');
    }
    var commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) {
      throw new Error('Malformed data URL (missing comma separator).');
    }
    var header = dataUrl.slice(0, commaIdx);
    var payload = dataUrl.slice(commaIdx + 1);
    var isBase64 = /;base64/i.test(header);

    if (isBase64) {
      var cleanBase64 = payload.replace(/\s+/g, '');
      if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
        var buf = Buffer.from(cleanBase64, 'base64');
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      }
      if (typeof atob === 'function') {
        var binStr = atob(cleanBase64);
        var out = new Uint8Array(binStr.length);
        for (var i = 0; i < binStr.length; i++) {
          out[i] = binStr.charCodeAt(i) & 0xff;
        }
        return out;
      }
      throw new Error('No Base64 decoder available in this environment.');
    }

    var decoded = decodeURIComponent(payload);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(decoded);
    }
    var raw = new Uint8Array(decoded.length);
    for (var j = 0; j < decoded.length; j++) {
      raw[j] = decoded.charCodeAt(j) & 0xff;
    }
    return raw;
  }

  /**
   * Locates SheetRenderer and renders a print-ready full Matchblatt SVG string,
   * or returns an explicitly supplied SVG string.
   */
  function getSVGString(stateOrSvg, options) {
    var opts = options || {};
    if (typeof stateOrSvg === 'string') {
      return stateOrSvg;
    }
    if (typeof opts.svgString === 'string') {
      return opts.svgString;
    }
    var state = unwrapState(stateOrSvg);
    var renderer =
      opts.sheetRenderer ||
      (typeof window !== 'undefined' && window.Matchblatt && window.Matchblatt.SheetRenderer) ||
      (root && root.Matchblatt && root.Matchblatt.SheetRenderer) ||
      null;

    if (!renderer && typeof require === 'function') {
      try {
        renderer = require('./sheet-renderer.js');
      } catch (_) {
        renderer = null;
      }
    }

    if (!renderer || typeof renderer.renderSVGString !== 'function') {
      throw new Error('Matchblatt.SheetRenderer.renderSVGString is not available.');
    }

    var renderOpts = Object.assign(
      {
        viewMode: 'full',
        showHighlights: false,
        interactive: false,
        printMode: true
      },
      opts.renderOptions || {}
    );

    return renderer.renderSVGString(state, renderOpts);
  }

  /**
   * Ensures the root <svg> has explicit xmlns, xmlns:xlink, and pixel width/height attributes,
   * and mirrors href="data:..." onto xlink:href on <image> elements for Safari/WebKit SVG rasterization.
   */
  function normalizeSVGForCanvas(svgString, width, height) {
    if (typeof svgString !== 'string' || !svgString.trim()) {
      throw new Error('Expected non-empty SVG string for canvas export.');
    }
    var svg = svgString.trim();

    // Ensure root <svg> has required namespaces and explicit pixel dimensions for crisp 2x rasterization
    svg = svg.replace(/<svg\b([^>]*)>/i, function (_match, attrs) {
      var updated = attrs;
      if (!/\bxmlns\s*=/.test(updated)) {
        updated += ' xmlns="http://www.w3.org/2000/svg"';
      }
      if (!/\bxmlns:xlink\s*=/.test(updated)) {
        updated += ' xmlns:xlink="http://www.w3.org/1999/xlink"';
      }
      if (!/\bviewBox\s*=/i.test(updated)) {
        updated += ' viewBox="0 0 1684 1190"';
      }
      if (/\bwidth\s*=\s*["'][^"']*["']/i.test(updated)) {
        updated = updated.replace(/\bwidth\s*=\s*["'][^"']*["']/i, 'width="' + width + '"');
      } else {
        updated += ' width="' + width + '"';
      }
      if (/\bheight\s*=\s*["'][^"']*["']/i.test(updated)) {
        updated = updated.replace(/\bheight\s*=\s*["'][^"']*["']/i, 'height="' + height + '"');
      } else {
        updated += ' height="' + height + '"';
      }
      return '<svg' + updated + '>';
    });

    // Ensure embedded signature <image href="data:..."> tags also carry xlink:href for iOS Safari
    svg = svg.replace(/<image\b([^>]*)>/gi, function (fullTag, attrs) {
      if (/\bxlink:href\s*=/i.test(attrs)) {
        return fullTag;
      }
      var hrefMatch = attrs.match(/\bhref\s*=\s*(["'])(data:[^"']*)\1/i);
      if (!hrefMatch) {
        return fullTag;
      }
      var quote = hrefMatch[1];
      var dataUri = hrefMatch[2];
      var isSelfClosing = /\/\s*>$/.test(fullTag);
      var cleanAttrs = isSelfClosing ? attrs.replace(/\/\s*$/, '') : attrs;
      return '<image' + cleanAttrs + ' xlink:href=' + quote + dataUri + quote + (isSelfClosing ? '/>' : '>');
    });

    return svg;
  }

  /**
   * Builds a self-contained data:image/svg+xml;charset=utf-8;base64,... URL
   * so embedded base64 signature PNGs render cleanly without tainting the canvas.
   */
  function buildSVGDataURL(svgString, usePercentFallback) {
    if (usePercentFallback) {
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    }
    return 'data:image/svg+xml;charset=utf-8;base64,' + utf8ToBase64(svgString);
  }

  /**
   * Converts a self-contained SVG string (or state) into a high-DPI HTML5 <canvas>
   * (3368x2380 by default) with a crisp #ffffff background.
   */
  function svgToCanvas(svgStringOrState, options) {
    var opts = options || {};
    var width = Number(opts.width) > 0 ? Math.round(Number(opts.width)) : DEFAULT_CANVAS_WIDTH;
    var height = Number(opts.height) > 0 ? Math.round(Number(opts.height)) : DEFAULT_CANVAS_HEIGHT;
    var backgroundColor = opts.backgroundColor || '#ffffff';

    return new Promise(function (resolve, reject) {
      var rawSvg;
      try {
        rawSvg = typeof svgStringOrState === 'string'
          ? svgStringOrState
          : getSVGString(svgStringOrState, opts);
      } catch (err) {
        reject(err);
        return;
      }

      var docObj = (opts && opts.document) || (typeof document !== 'undefined' ? document : null);
      var ImageCtor = (opts && opts.Image) || (typeof Image !== 'undefined' ? Image : null);

      if (!docObj || typeof docObj.createElement !== 'function' || !ImageCtor) {
        reject(new Error('HTML5 Canvas / Image APIs require a browser DOM environment.'));
        return;
      }

      var normalizedSvg;
      try {
        normalizedSvg = normalizeSVGForCanvas(rawSvg, width, height);
      } catch (err2) {
        reject(err2);
        return;
      }

      var canvas = docObj.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext('2d');
      if (!ctx && (width > FALLBACK_CANVAS_WIDTH || height > FALLBACK_CANVAS_HEIGHT)) {
        width = FALLBACK_CANVAS_WIDTH;
        height = FALLBACK_CANVAS_HEIGHT;
        normalizedSvg = normalizeSVGForCanvas(rawSvg, width, height);
        canvas = docObj.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');
      }
      if (!ctx) {
        reject(new Error('Failed to acquire 2D rendering context on export canvas.'));
        return;
      }

      // Paint crisp white paper background before drawing SVG
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      if ('imageSmoothingEnabled' in ctx) {
        ctx.imageSmoothingEnabled = true;
      }
      if ('imageSmoothingQuality' in ctx) {
        ctx.imageSmoothingQuality = 'high';
      }

      var triedFallback = false;
      var img = new ImageCtor();
      // Data URLs are same-origin; avoid setting crossOrigin on data: URLs in older Safari

      function drawAndResolve() {
        try {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas);
        } catch (drawErr) {
          reject(drawErr);
        }
      }

      img.onload = function () {
        if (typeof img.decode === 'function') {
          img.decode().then(drawAndResolve, drawAndResolve);
        } else {
          drawAndResolve();
        }
      };

      img.onerror = function () {
        if (!triedFallback) {
          triedFallback = true;
          try {
            img.src = buildSVGDataURL(normalizedSvg, true);
            return;
          } catch (_) {
            // Fall through to reject
          }
        }
        reject(new Error('Failed to rasterize Matchblatt SVG onto HTML5 canvas.'));
      };

      try {
        img.src = buildSVGDataURL(normalizedSvg, false);
      } catch (encodeErr) {
        reject(encodeErr);
      }
    });
  }

  /**
   * Converts an HTML5 canvas into a Blob, with dataURL fallback for older WebViews.
   */
  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise(function (resolve, reject) {
      if (typeof canvas.toBlob === 'function') {
        try {
          canvas.toBlob(function (blob) {
            if (blob) {
              resolve(blob);
              return;
            }
            try {
              var fallbackUrl = canvas.toDataURL(mimeType, quality);
              var bytes = dataURLToUint8Array(fallbackUrl);
              resolve(new Blob([bytes], { type: mimeType }));
            } catch (err) {
              reject(err);
            }
          }, mimeType, quality);
          return;
        } catch (_) {
          // Fall through to toDataURL fallback
        }
      }
      try {
        var dataUrl = canvas.toDataURL(mimeType, quality);
        var rawBytes = dataURLToUint8Array(dataUrl);
        resolve(new Blob([rawBytes], { type: mimeType }));
      } catch (err2) {
        reject(err2);
      }
    });
  }

  /**
   * Renders Matchblatt state (or SVG string) to a high-DPI PNG Blob.
   */
  async function toPNGBlob(state, options) {
    var opts = options || {};
    var svgString = getSVGString(state, opts);
    var canvas = await svgToCanvas(svgString, opts);
    return canvasToBlob(canvas, 'image/png');
  }

  /**
   * Triggers a clean client-side file download in desktop & mobile browsers.
   * Delays ObjectURL revocation so iOS Safari finishes reading the blob stream.
   */
  function triggerBlobDownload(blob, filename) {
    if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      throw new Error('Browser DOM / URL.createObjectURL is required to trigger file download.');
    }
    var objectUrl = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    if (document.body) {
      document.body.appendChild(anchor);
    }
    anchor.click();
    if (anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    var revokeTimer = setTimeout(function () {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (_) {}
    }, 15000);
    if (revokeTimer && typeof revokeTimer.unref === 'function') {
      revokeTimer.unref();
    }
  }

  /**
   * Checks whether the current browser supports Web Share API Level 2 file sharing.
   */
  function canShareFiles(mimeType) {
    if (
      typeof navigator === 'undefined' ||
      typeof navigator.share !== 'function' ||
      typeof File === 'undefined'
    ) {
      return false;
    }
    if (typeof navigator.canShare !== 'function') {
      return true;
    }
    try {
      var ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/svg+xml' ? 'svg' : 'pdf';
      var probe = new File([new Uint8Array([0])], 'probe.' + ext, { type: mimeType || 'application/pdf' });
      return Boolean(navigator.canShare({ files: [probe] }));
    } catch (_) {
      return false;
    }
  }

  /**
   * Shares a Blob via native iOS/Android Share Sheet (Photos, WhatsApp, Mail, Files),
   * falling back cleanly to browser download when unsupported.
   * Returns true if shared natively, or false if dismissed / downloaded via fallback.
   */
  async function shareOrDownloadBlob(blob, filename, mimeType) {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof File !== 'undefined'
    ) {
      try {
        var file = new File([blob], filename, {
          type: mimeType,
          lastModified: Date.now()
        });
        var canShareThis = typeof navigator.canShare === 'function'
          ? navigator.canShare({ files: [file] })
          : true;

        if (canShareThis) {
          await navigator.share({
            files: [file],
            title: filename.replace(/\.[^.]+$/, '')
          });
          return true;
        }
      } catch (err) {
        if (err && err.name === 'AbortError') {
          // User cancelled the native share sheet intentionally
          return false;
        }
        // Any other error (e.g. gesture expiration or platform limitation) falls back to download
      }
    }

    triggerBlobDownload(blob, filename);
    return false;
  }

  /**
   * Downloads the rendered Matchblatt as a high-DPI PNG file.
   */
  async function downloadPNG(state, filename, options) {
    var resolved = normalizeFileAndOptions(state, filename, options, 'png');
    var blob = await toPNGBlob(state, resolved.options);
    triggerBlobDownload(blob, resolved.filename);
  }

  /**
   * Shares the rendered Matchblatt PNG via native Share Sheet, or falls back to downloadPNG.
   */
  async function sharePNG(state, filename, options) {
    var resolved = normalizeFileAndOptions(state, filename, options, 'png');
    var blob = await toPNGBlob(state, resolved.options);
    return shareOrDownloadBlob(blob, resolved.filename, 'image/png');
  }

  /**
   * Builds a standalone, print-clean XML SVG string (with XML declaration and explicit viewBox/width/height)
   * and returns an `image/svg+xml` Blob for infinite-resolution vector viewing or printing.
   */
  function toSVGBlob(state, options) {
    var rawSvg = getSVGString(state, options);
    var normalized = normalizeSVGForCanvas(rawSvg, 1684, 1190);
    var xmlHeader = /^<\?xml\b/i.test(normalized) ? '' : '<?xml version="1.0" encoding="UTF-8"?>\n';
    return new Blob([xmlHeader + normalized], { type: 'image/svg+xml;charset=utf-8' });
  }

  /**
   * Downloads the rendered Matchblatt directly as a pure vector `.svg` file.
   */
  function downloadSVG(state, filename, options) {
    var resolved = normalizeFileAndOptions(state, filename, options, 'svg');
    var blob = toSVGBlob(state, resolved.options);
    triggerBlobDownload(blob, resolved.filename);
  }

  /**
   * Shares the pure vector `.svg` file via native Share Sheet, or falls back to downloadSVG.
   */
  async function shareSVG(state, filename, options) {
    var resolved = normalizeFileAndOptions(state, filename, options, 'svg');
    var blob = toSVGBlob(state, resolved.options);
    return shareOrDownloadBlob(blob, resolved.filename, 'image/svg+xml');
  }

  /**
   * Opens the standalone vector Matchblatt SVG in a new browser tab for native mobile pinch-to-zoom & printing.
   * Falls back to downloadSVG if popup blocking prevents opening a new tab.
   */
  function openSVG(state, options) {
    var blob = toSVGBlob(state, options);
    if (typeof window !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      var objectUrl = URL.createObjectURL(blob);
      var win = typeof window.open === 'function' ? window.open(objectUrl, '_blank', 'noopener') : null;
      if (!win) {
        triggerBlobDownload(blob, buildDefaultFilename(state, 'svg'));
      }
      var revokeTimer = setTimeout(function () {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch (_) {}
      }, 60000);
      if (revokeTimer && typeof revokeTimer.unref === 'function') {
        revokeTimer.unref();
      }
      return true;
    }
    return false;
  }

  /**
   * Encodes a pure ASCII string into a Uint8Array (1 char = 1 byte) so binary offsets never drift.
   */
  function asciiToBytes(asciiStr) {
    var len = asciiStr.length;
    var out = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      out[i] = asciiStr.charCodeAt(i) & 0x7f;
    }
    return out;
  }

  /**
   * Extracts pixel width and height from a JPEG SOF marker if dimensions were not explicitly passed.
   */
  function parseJPEGDimensions(jpegBytes) {
    if (!jpegBytes || jpegBytes.length < 4 || jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) {
      return null;
    }
    var i = 2;
    var len = jpegBytes.length;
    while (i + 1 < len) {
      if (jpegBytes[i] !== 0xff) {
        i++;
        continue;
      }
      while (i < len && jpegBytes[i] === 0xff) {
        i++;
      }
      if (i >= len) break;
      var marker = jpegBytes[i];
      i++;

      // Standalone markers without length payload
      if (
        marker === 0xd8 ||
        marker === 0xd9 ||
        marker === 0x01 ||
        (marker >= 0xd0 && marker <= 0xd7)
      ) {
        continue;
      }
      if (i + 1 >= len) break;
      var segLength = (jpegBytes[i] << 8) | jpegBytes[i + 1];
      if (segLength < 2 || i + segLength > len) break;

      // SOF0..SOF15 (excluding DHT 0xC4, JPG 0xC8, DAC 0xCC)
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        if (segLength >= 7 && i + 6 < len) {
          var height = (jpegBytes[i + 3] << 8) | jpegBytes[i + 4];
          var width = (jpegBytes[i + 5] << 8) | jpegBytes[i + 6];
          if (width > 0 && height > 0) {
            return { width: width, height: height };
          }
        }
        break;
      }
      i += segLength;
    }
    return null;
  }

  function formatPDFNumber(num) {
    var fixed = Number(num).toFixed(4);
    return fixed.replace(/\.?0+$/, '');
  }

  /**
   * Pure function (Node.js & Browser):
   * Constructs a standards-compliant PDF-1.4 A4 Landscape (841.89 x 595.28 pt) binary document
   * embedding jpegUint8Array raw via /DCTDecode (/DeviceRGB, 8 bpc) with exact xref byte offsets.
   */
  function buildPDFBytesFromJPEG(jpegUint8Array, pixelWidth, pixelHeight) {
    var jpegBytes;
    if (jpegUint8Array instanceof Uint8Array) {
      jpegBytes = jpegUint8Array;
    } else if (typeof ArrayBuffer !== 'undefined' && jpegUint8Array instanceof ArrayBuffer) {
      jpegBytes = new Uint8Array(jpegUint8Array);
    } else if (ArrayBuffer.isView && ArrayBuffer.isView(jpegUint8Array)) {
      jpegBytes = new Uint8Array(
        jpegUint8Array.buffer,
        jpegUint8Array.byteOffset,
        jpegUint8Array.byteLength
      );
    } else if (Array.isArray(jpegUint8Array)) {
      jpegBytes = new Uint8Array(jpegUint8Array);
    } else {
      throw new Error('buildPDFBytesFromJPEG requires a Uint8Array or ArrayBuffer of JPEG bytes.');
    }

    if (jpegBytes.length === 0) {
      throw new Error('buildPDFBytesFromJPEG received an empty JPEG buffer.');
    }

    var wPx = Number(pixelWidth) > 0 ? Math.round(Number(pixelWidth)) : 0;
    var hPx = Number(pixelHeight) > 0 ? Math.round(Number(pixelHeight)) : 0;
    if (!wPx || !hPx) {
      var parsed = parseJPEGDimensions(jpegBytes);
      if (parsed) {
        if (!wPx) wPx = parsed.width;
        if (!hPx) hPx = parsed.height;
      }
    }
    if (!wPx) wPx = DEFAULT_CANVAS_WIDTH;
    if (!hPx) hPx = DEFAULT_CANVAS_HEIGHT;

    var pageW = A4_LANDSCAPE_WIDTH_PT;
    var pageH = A4_LANDSCAPE_HEIGHT_PT;
    var availW = pageW - 2 * PDF_MARGIN_PT;
    var availH = pageH - 2 * PDF_MARGIN_PT;
    var scale = Math.min(availW / wPx, availH / hPx);
    var drawW = wPx * scale;
    var drawH = hPx * scale;
    var offsetX = (pageW - drawW) / 2;
    var offsetY = (pageH - drawH) / 2;

    var chunks = [];
    var byteCursor = 0;
    var offsets = [0]; // index 0 is free object 0

    function pushBytes(bytes) {
      chunks.push(bytes);
      byteCursor += bytes.length;
    }

    function pushASCII(str) {
      pushBytes(asciiToBytes(str));
    }

    // PDF-1.4 header + 4-byte high-bit binary indicator comment (raw bytes, never UTF-8)
    pushASCII('%PDF-1.4\n');
    pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

    // Object 1: Catalog
    offsets[1] = byteCursor;
    pushASCII('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // Object 2: Pages tree
    offsets[2] = byteCursor;
    pushASCII('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    // Object 3: A4 Landscape Page (841.89 x 595.28 pt)
    offsets[3] = byteCursor;
    pushASCII(
      '3 0 obj\n' +
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] ' +
      '/Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 5 0 R >> >> ' +
      '/Contents 4 0 R >>\n' +
      'endobj\n'
    );

    // Object 4: Page content stream (white sheet background + scaled/centered JPEG XObject)
    var contentStream =
      'q\n' +
      '1 1 1 rg\n' +
      '0 0 ' + pageW + ' ' + pageH + ' re f\n' +
      formatPDFNumber(drawW) + ' 0 0 ' + formatPDFNumber(drawH) + ' ' +
      formatPDFNumber(offsetX) + ' ' + formatPDFNumber(offsetY) + ' cm\n' +
      '/Im0 Do\n' +
      'Q';
    var contentBytes = asciiToBytes(contentStream);
    offsets[4] = byteCursor;
    pushASCII('4 0 obj\n<< /Length ' + contentBytes.length + ' >>\nstream\n');
    pushBytes(contentBytes);
    pushASCII('\nendstream\nendobj\n');

    // Object 5: Image XObject (/DCTDecode raw JPEG binary stream)
    offsets[5] = byteCursor;
    pushASCII(
      '5 0 obj\n' +
      '<< /Type /XObject /Subtype /Image ' +
      '/Width ' + wPx + ' /Height ' + hPx + ' ' +
      '/ColorSpace /DeviceRGB /BitsPerComponent 8 ' +
      '/Filter /DCTDecode /Length ' + jpegBytes.length + ' >>\n' +
      'stream\n'
    );
    pushBytes(jpegBytes);
    pushASCII('\nendstream\nendobj\n');

    // Object 6: Document Info dictionary
    offsets[6] = byteCursor;
    pushASCII(
      '6 0 obj\n' +
      '<< /Title (Swiss Volley Matchblatt) /Producer (Matchblatt Offline PDF-1.4 Engine) >>\n' +
      'endobj\n'
    );

    // Cross-reference table (every entry strictly 20 bytes: "nnnnnnnnnn ggggg n \n")
    var totalObjects = 7; // 0..6
    var xrefOffset = byteCursor;
    var xrefLines = 'xref\n0 ' + totalObjects + '\n0000000000 65535 f \n';
    for (var objNum = 1; objNum < totalObjects; objNum++) {
      var paddedOffset = String(offsets[objNum]).padStart(10, '0');
      xrefLines += paddedOffset + ' 00000 n \n';
    }
    pushASCII(xrefLines);

    // Trailer + startxref + %%EOF
    pushASCII(
      'trailer\n' +
      '<< /Size ' + totalObjects + ' /Root 1 0 R /Info 6 0 R >>\n' +
      'startxref\n' +
      xrefOffset + '\n' +
      '%%EOF'
    );

    // Assemble final contiguous Uint8Array
    var pdfBytes = new Uint8Array(byteCursor);
    var writePos = 0;
    for (var c = 0; c < chunks.length; c++) {
      pdfBytes.set(chunks[c], writePos);
      writePos += chunks[c].length;
    }
    return pdfBytes;
  }

  /**
   * Renders Matchblatt SVG -> high-DPI canvas -> JPEG -> PDF-1.4 A4 Landscape Blob.
   */
  async function toPDFBlob(state, options) {
    var opts = options || {};
    var quality = typeof opts.quality === 'number'
      ? Math.max(0.1, Math.min(1.0, opts.quality))
      : 0.94;
    var width = Number(opts.width) > 0 ? Math.round(Number(opts.width)) : DEFAULT_CANVAS_WIDTH;
    var height = Number(opts.height) > 0 ? Math.round(Number(opts.height)) : DEFAULT_CANVAS_HEIGHT;

    var svgString = getSVGString(state, opts);
    var canvas = await svgToCanvas(svgString, Object.assign({}, opts, { width: width, height: height }));
    var jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
    var jpegBytes = dataURLToUint8Array(jpegDataUrl);
    var pdfBytes = buildPDFBytesFromJPEG(
      jpegBytes,
      canvas.width || width,
      canvas.height || height
    );
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  /**
   * Downloads the rendered Matchblatt as an A4 Landscape PDF-1.4 file.
   */
  async function downloadPDF(state, filename, options) {
    var resolved = normalizeFileAndOptions(state, filename, options, 'pdf');
    var blob = await toPDFBlob(state, resolved.options);
    triggerBlobDownload(blob, resolved.filename);
  }

  /**
   * Shares the rendered Matchblatt PDF via native Share Sheet, or falls back to downloadPDF.
   */
  async function sharePDF(state, filename, options) {
    var resolved = normalizeFileAndOptions(state, filename, options, 'pdf');
    var blob = await toPDFBlob(state, resolved.options);
    return shareOrDownloadBlob(blob, resolved.filename, 'application/pdf');
  }

  /**
   * Serializes a full Matchblatt store doc (including undo/redo history) into formatted JSON.
   */
  function toJSONString(doc) {
    if (!doc || typeof doc !== 'object') {
      throw new Error('exportJSON expected a Matchblatt document or state object.');
    }
    var payload;
    if (doc.state && typeof doc.state === 'object') {
      payload = {
        format: 'matchblatt-backup',
        version: typeof doc.version === 'number' ? doc.version : 1,
        exportedAt: new Date().toISOString(),
        state: doc.state,
        past: Array.isArray(doc.past) ? doc.past : [],
        future: Array.isArray(doc.future) ? doc.future : []
      };
    } else {
      payload = {
        format: 'matchblatt-backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        state: doc,
        past: [],
        future: []
      };
    }
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Triggers a browser download of the full match + undo history JSON backup.
   */
  function exportJSON(doc, filename) {
    var jsonText = toJSONString(doc);
    var resolvedName = ensureExtension(
      filename || buildDefaultFilename(doc, 'json'),
      'json'
    );
    if (
      typeof document !== 'undefined' &&
      typeof Blob !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    ) {
      var blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
      triggerBlobDownload(blob, resolvedName);
    }
  }

  function readBlobWithFileReader(fileOrBlob) {
    return new Promise(function (resolve, reject) {
      if (typeof FileReader === 'undefined') {
        reject(new Error('Cannot read File/Blob in this environment.'));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ''));
      };
      reader.onerror = function () {
        reject(new Error('Failed to read JSON backup file.'));
      };
      reader.readAsText(fileOrBlob, 'utf-8');
    });
  }

  /**
   * Imports and validates a Matchblatt JSON backup from a JSON string, File/Blob, Uint8Array, or object.
   * Resolves a normalized Engine doc: { state, past, future, version }.
   */
  async function importJSON(jsonTextOrFile) {
    if (jsonTextOrFile === null || jsonTextOrFile === undefined) {
      throw new Error('No JSON input provided to importJSON.');
    }

    var parsed;
    if (typeof jsonTextOrFile === 'string') {
      var trimmed = jsonTextOrFile.replace(/^\uFEFF/, '').trim();
      if (!trimmed) {
        throw new Error('JSON backup input is empty.');
      }
      try {
        parsed = JSON.parse(trimmed);
      } catch (err) {
        throw new Error('Invalid JSON syntax in backup file: ' + err.message);
      }
    } else if (typeof ArrayBuffer !== 'undefined' && jsonTextOrFile instanceof ArrayBuffer) {
      var dec1 = new TextDecoder('utf-8').decode(new Uint8Array(jsonTextOrFile));
      return importJSON(dec1);
    } else if (ArrayBuffer.isView && ArrayBuffer.isView(jsonTextOrFile)) {
      var view = new Uint8Array(
        jsonTextOrFile.buffer,
        jsonTextOrFile.byteOffset,
        jsonTextOrFile.byteLength
      );
      var dec2 = new TextDecoder('utf-8').decode(view);
      return importJSON(dec2);
    } else if (
      typeof jsonTextOrFile === 'object' &&
      (typeof jsonTextOrFile.text === 'function' ||
        (typeof Blob !== 'undefined' && jsonTextOrFile instanceof Blob))
    ) {
      var fileText = typeof jsonTextOrFile.text === 'function'
        ? await jsonTextOrFile.text()
        : await readBlobWithFileReader(jsonTextOrFile);
      return importJSON(fileText);
    } else if (typeof jsonTextOrFile === 'object') {
      parsed = jsonTextOrFile;
    } else {
      throw new Error('Unsupported input type passed to importJSON.');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Imported JSON root must be an object.');
    }

    // Support both full store doc ({ state, past, future, version }) and plain state objects
    var doc;
    if (parsed.state && typeof parsed.state === 'object') {
      doc = {
        state: JSON.parse(JSON.stringify(parsed.state)),
        past: Array.isArray(parsed.past) ? JSON.parse(JSON.stringify(parsed.past)) : [],
        future: Array.isArray(parsed.future) ? JSON.parse(JSON.stringify(parsed.future)) : [],
        version: typeof parsed.version === 'number' ? parsed.version : 1
      };
    } else if (parsed.teams && Array.isArray(parsed.sets)) {
      doc = {
        state: JSON.parse(JSON.stringify(parsed)),
        past: [],
        future: [],
        version: 1
      };
    } else {
      throw new Error('JSON file does not appear to be a valid Matchblatt backup (missing state.teams / state.sets).');
    }

    if (
      !doc.state.teams ||
      !doc.state.teams.A ||
      !doc.state.teams.B ||
      !Array.isArray(doc.state.sets)
    ) {
      throw new Error('Invalid Matchblatt state in JSON backup (missing teams A/B or sets array).');
    }

    return doc;
  }

  var Exporter = {
    svgToCanvas: svgToCanvas,
    toPNGBlob: toPNGBlob,
    downloadPNG: downloadPNG,
    sharePNG: sharePNG,
    toSVGBlob: toSVGBlob,
    downloadSVG: downloadSVG,
    shareSVG: shareSVG,
    openSVG: openSVG,
    buildPDFBytesFromJPEG: buildPDFBytesFromJPEG,
    toPDFBlob: toPDFBlob,
    downloadPDF: downloadPDF,
    sharePDF: sharePDF,
    exportJSON: exportJSON,
    importJSON: importJSON,
    toJSONString: toJSONString,
    buildDefaultFilename: buildDefaultFilename,
    canShareFiles: canShareFiles,
    getSVGString: getSVGString,
    dataURLToUint8Array: dataURLToUint8Array
  };

  if (typeof window !== 'undefined') {
    window.Matchblatt = window.Matchblatt || {};
    window.Matchblatt.Exporter = Exporter;
  }
  if (root && typeof root === 'object' && root !== (typeof window !== 'undefined' ? window : null)) {
    if (root.Matchblatt && typeof root.Matchblatt === 'object') {
      root.Matchblatt.Exporter = Exporter;
    }
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      svgToCanvas: svgToCanvas,
      toPNGBlob: toPNGBlob,
      downloadPNG: downloadPNG,
      sharePNG: sharePNG,
      toSVGBlob: toSVGBlob,
      downloadSVG: downloadSVG,
      shareSVG: shareSVG,
      openSVG: openSVG,
      buildPDFBytesFromJPEG: buildPDFBytesFromJPEG,
      toPDFBlob: toPDFBlob,
      downloadPDF: downloadPDF,
      sharePDF: sharePDF,
      exportJSON: exportJSON,
      importJSON: importJSON,
      toJSONString: toJSONString,
      buildDefaultFilename: buildDefaultFilename,
      canShareFiles: canShareFiles,
      getSVGString: getSVGString,
      dataURLToUint8Array: dataURLToUint8Array
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
