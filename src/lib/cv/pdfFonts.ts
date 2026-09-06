/**
 * pdfFonts.ts
 *
 * Registers all font families needed by @react-pdf/renderer templates.
 *
 * CRITICAL FIX FOR:
 * "TypeError: Cannot read properties of undefined (reading 'unitsPerEm')"
 *
 * ROOT CAUSE:
 * 1. Built-in PDF standard fonts (StandardFont in @react-pdf/font) do NOT implement
 *    fontkit methods like `hasGlyphForCodePoint` and lack full glyph metrics in browser mode.
 * 2. @react-pdf/renderer's fontkit engine only supports TrueType (.ttf) and OpenType (.otf).
 *    It does NOT support .woff2 (which caused previous attempts to silently fail with unitsPerEm undefined).
 *
 * SOLUTION:
 * We serve verified TrueType (.ttf) font binaries locally from /public/fonts/ and register
 * all font family names used across CV templates (Helvetica, Helvetica-Bold, Helvetica-Oblique,
 * Times-Roman, Times-Bold, etc.).
 */

import { Font } from '@react-pdf/renderer';

const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
const base = `${origin}/fonts`;

const regularTtf = `${base}/roboto-regular.ttf`;
const boldTtf = `${base}/roboto-bold.ttf`;
const italicTtf = `${base}/roboto-italic.ttf`;
const boldItalicTtf = `${base}/roboto-bolditalic.ttf`;

// ── Helvetica ─────────────────────────────────────────────────────────────────
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: regularTtf, fontWeight: 400, fontStyle: 'normal' },
    { src: boldTtf, fontWeight: 700, fontStyle: 'normal' },
    { src: italicTtf, fontWeight: 400, fontStyle: 'italic' },
    { src: boldItalicTtf, fontWeight: 700, fontStyle: 'italic' },
  ],
});

// ── Helvetica-Bold (used directly as fontFamily in styles) ────────────────────
Font.register({
  family: 'Helvetica-Bold',
  fonts: [
    { src: boldTtf, fontWeight: 400, fontStyle: 'normal' },
    { src: boldTtf, fontWeight: 700, fontStyle: 'normal' },
  ],
});

// ── Helvetica-Oblique (used directly as fontFamily in styles) ─────────────────
Font.register({
  family: 'Helvetica-Oblique',
  fonts: [
    { src: italicTtf, fontWeight: 400, fontStyle: 'normal' },
    { src: italicTtf, fontWeight: 400, fontStyle: 'italic' },
  ],
});

// ── Helvetica-BoldOblique ─────────────────────────────────────────────────────
Font.register({
  family: 'Helvetica-BoldOblique',
  fonts: [
    { src: boldItalicTtf, fontWeight: 400, fontStyle: 'normal' },
    { src: boldItalicTtf, fontWeight: 700, fontStyle: 'italic' },
  ],
});

// ── Times-Roman ───────────────────────────────────────────────────────────────
Font.register({
  family: 'Times-Roman',
  fonts: [
    { src: regularTtf, fontWeight: 400, fontStyle: 'normal' },
    { src: boldTtf, fontWeight: 700, fontStyle: 'normal' },
    { src: italicTtf, fontWeight: 400, fontStyle: 'italic' },
    { src: boldItalicTtf, fontWeight: 700, fontStyle: 'italic' },
  ],
});

// ── Times-Bold (used directly as fontFamily in styles) ────────────────────────
Font.register({
  family: 'Times-Bold',
  fonts: [
    { src: boldTtf, fontWeight: 400, fontStyle: 'normal' },
    { src: boldTtf, fontWeight: 700, fontStyle: 'normal' },
  ],
});

// ── Times-Italic ──────────────────────────────────────────────────────────────
Font.register({
  family: 'Times-Italic',
  fonts: [
    { src: italicTtf, fontWeight: 400, fontStyle: 'normal' },
    { src: italicTtf, fontWeight: 400, fontStyle: 'italic' },
  ],
});

// Disable hyphenation — prevents unexpected mid-word line breaks in CVs.
Font.registerHyphenationCallback((word) => [word]);
