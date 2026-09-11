/**
 * Polyfills required by pdfjs-dist 6.x.
 *
 * WHY THIS EXISTS
 *
 * pdf.js 6 targets very recent browsers and ships no polyfills of its own. The
 * CV preview (src/components/cv/PdfPreview.tsx) rasterises the generated PDF
 * with it, so on an older browser rendering throws and the user sees "Failed to
 * generate image preview" instead of the design they picked — or, when the
 * throw happens inside an async worker callback, the spinner simply never ends.
 * That covers older Android builds and manufacturer WebViews, iPhones below
 * iOS 26.2, and the in-app browsers inside Facebook, Instagram and WhatsApp.
 *
 * Every entry below was found by actually rendering a PDF on a runtime without
 * these APIs and fixing whatever broke next, so the list is empirical rather
 * than guessed. Versions are where each API first shipped:
 *
 *   Map.prototype.getOrInsertComputed   Chrome 145 / FF 144 / Safari 26.2
 *       160 calls in one render. Used unconditionally inside
 *       PDFPageProxy.render() (pdf.mjs:15598) — the exact call the preview makes.
 *   Promise.try                         Chrome 134 / FF 134 / Safari 18.2
 *       The worker message plumbing. Nothing renders without it.
 *   Promise.withResolvers               Chrome 119 / FF 121 / Safari 17.4
 *       177 calls in one render.
 *   Math.sumPrecise                     Chrome 139 / FF 138 / Safari 18.4
 *       Font handling, in the worker.
 *   Uint8Array.prototype.toHex          Chrome 140 / FF 133 / Safari 18.2
 *       Document fingerprinting (pdf.worker.mjs:59861) — runs for every file.
 *   URL.parse                           Chrome 126 / FF 126 / Safari 18
 *   ArrayBuffer.prototype.transferToFixedLength
 *                                       Chrome 114 / FF 122 / Safari 18.2
 *
 * Float16Array is deliberately NOT polyfilled: pdf.js feature-detects it
 * (FeatureTest.isFloat16ArraySupported) and falls back to Float32Array.
 *
 * WHY PLAIN JAVASCRIPT AND NOT TYPESCRIPT
 *
 * pdf.js runs its heavy lifting in a Web Worker, which is a separate realm with
 * its own globals — polyfilling the page does nothing for it. A single render
 * makes 7 Promise.withResolvers, 4 Promise.try and 12 Math.sumPrecise calls
 * from inside worker code, so the worker must be patched too. PdfPreview does
 * that by importing this file's own source text with Vite's `?raw` and
 * prepending it to the worker bootstrap. Keeping the file as plain JS means the
 * page and the worker run byte-for-byte the same implementation, from one
 * source of truth, with no build step in between and no eval() on the page.
 */

/** Define a method the way the engine would: non-enumerable, never over an existing one. */
function definePolyfill(target, name, value) {
  if (name in target) return;
  Object.defineProperty(target, name, {
    value,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}

// ── Map / WeakMap upsert helpers (TC39 "upsert" proposal) ────────────────────
// Both use has() rather than a truthiness check on get(), so a stored 0, null
// or undefined counts as present and is not overwritten.

function getOrInsert(key, value) {
  if (this.has(key)) return this.get(key);
  this.set(key, value);
  return value;
}

function getOrInsertComputed(key, callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('getOrInsertComputed: callback must be a function');
  }
  if (this.has(key)) return this.get(key);
  const computed = callback(key);
  this.set(key, computed);
  return computed;
}

// WeakMap is included because pdf.js calls getOrInsertComputed on one in its
// XFA path (`somCache`); polyfilling only Map would leave that gap.
for (const ctor of [Map, WeakMap]) {
  definePolyfill(ctor.prototype, 'getOrInsert', getOrInsert);
  definePolyfill(ctor.prototype, 'getOrInsertComputed', getOrInsertComputed);
}

// ── Promise.try ─────────────────────────────────────────────────────────────
// Runs fn synchronously and always returns a promise: a returned value resolves
// it, a synchronous throw rejects it instead of propagating.
definePolyfill(Promise, 'try', function tryFn(fn, ...args) {
  const Ctor = typeof this === 'function' ? this : Promise;
  return new Ctor((resolve) => resolve(fn(...args)));
});

// ── Promise.withResolvers ───────────────────────────────────────────────────
definePolyfill(Promise, 'withResolvers', function withResolvers() {
  const Ctor = typeof this === 'function' ? this : Promise;
  let resolve;
  let reject;
  const promise = new Ctor((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
});

// ── Math.sumPrecise ─────────────────────────────────────────────────────────
// Kahan-Babuska-Neumaier compensated summation: far more accurate than a naive
// loop, and enough for the glyph and line-length totals pdf.js uses it for.
definePolyfill(Math, 'sumPrecise', function sumPrecise(values) {
  let sum = 0;
  let compensation = 0;
  for (const raw of values) {
    const value = Number(raw);
    const next = sum + value;
    // Accumulate the low-order bits lost to rounding in this addition.
    compensation += Math.abs(sum) >= Math.abs(value)
      ? (sum - next) + value
      : (value - next) + sum;
    sum = next;
  }
  const total = sum + compensation;
  return Number.isFinite(total) ? total : sum;
});

// ── Uint8Array hex / base64 ─────────────────────────────────────────────────

const POLYFILL_HEX_DIGITS = '0123456789abcdef';

definePolyfill(Uint8Array.prototype, 'toHex', function toHex() {
  let out = '';
  for (let i = 0; i < this.length; i++) {
    out += POLYFILL_HEX_DIGITS[this[i] >> 4] + POLYFILL_HEX_DIGITS[this[i] & 15];
  }
  return out;
});

definePolyfill(Uint8Array, 'fromHex', function fromHex(input) {
  if (typeof input !== 'string') throw new TypeError('fromHex: expected a string');
  if (input.length % 2 !== 0) throw new SyntaxError('fromHex: odd-length string');
  const out = new Uint8Array(input.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(input.substr(i * 2, 2), 16);
    if (Number.isNaN(byte)) throw new SyntaxError('fromHex: invalid hex digit');
    out[i] = byte;
  }
  return out;
});

definePolyfill(Uint8Array.prototype, 'toBase64', function toBase64() {
  // Chunked so a large buffer cannot exceed the argument limit of fromCharCode.
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < this.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, this.subarray(i, i + CHUNK));
  }
  return btoa(binary);
});

definePolyfill(Uint8Array, 'fromBase64', function fromBase64(input) {
  const binary = atob(input);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
});

// ── URL.parse ───────────────────────────────────────────────────────────────
// Unlike `new URL()` it returns null instead of throwing; pdf.js depends on
// that when validating link and annotation URLs.
definePolyfill(URL, 'parse', function parse(url, base) {
  try {
    return base === undefined ? new URL(url) : new URL(url, base);
  } catch {
    return null;
  }
});

// ── ArrayBuffer.prototype.transferToFixedLength ─────────────────────────────
// Used when pdf.js rebuilds embedded fonts. The copy fallback cannot detach the
// source the way the native method does, which is harmless here: pdf.js drops
// the source buffer immediately afterwards.
definePolyfill(ArrayBuffer.prototype, 'transferToFixedLength', function transferToFixedLength(newLength) {
  const size = newLength === undefined ? this.byteLength : newLength;
  const out = new ArrayBuffer(size);
  new Uint8Array(out).set(new Uint8Array(this, 0, Math.min(size, this.byteLength)));
  return out;
});
