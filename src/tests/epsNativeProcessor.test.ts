import { describe, it, expect } from 'vitest';
import {
  cleanBaseName,
  generateSeoFilename,
  extractEpsMetadataAndPreview,
  embedEpsMetadata,
} from '../utils/epsNativeProcessor';
import { sanitizeKeywords } from '../utils/negativeKeywords';
import { resolveExportFilename, generateMarketplaceCsv } from '../utils/universalExportManager';
import { StockFile } from '../types/stock';

describe('EPS Filename Cleaner & SEO Filename Slugger', () => {
  it('cleans raw timestamped filenames and preserves quantities', () => {
    const raw = '20261010151843_affogato_coffee_dessert_28_icons_set_final.eps';
    const cleaned = cleanBaseName(raw);
    expect(cleaned).toBe('affogato coffee dessert 28 icons set');
  });

  it('removes long numeric IDs, date suffixes, and clutter words like copy, sheet, final', () => {
    const raw = 'IMG_20240915_barista_tools_sheet_copy_v2_12948194.eps';
    const cleaned = cleanBaseName(raw);
    expect(cleaned).toBe('barista tools');
  });

  it('generates clean SEO hyphen slugs with correct extension', () => {
    const title = 'Affogato Coffee Dessert 28 Icons Set for Cafe Menu Branding';
    const slug = generateSeoFilename(title, '20261010151843_affogato.eps');
    expect(slug).toBe('affogato-coffee-dessert-28-icons-set-cafe-menu.eps');
    expect(slug).toMatch(/^[a-z0-9-]+\.eps$/);
  });
});

describe('Native EPS Preview & Text Extractor (Zero Dependencies)', () => {
  it('extracts embedded XMP JPEG thumbnail and cleans &#xA; entities', () => {
    const dummyJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const epsContent = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 100 100
%BeginPhotoshop: 100
%Adobe_Photoshop_XML_Block
<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:xmpGImg="http://ns.adobe.com/xap/1.0/g/img/">
   <xmpGImg:image>
    ${dummyJpegBase64.slice(0, 40)}&#xA;${dummyJpegBase64.slice(40)}
   </xmpGImg:image>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
(AFFOGATO) [
(28 ICONS SET) [
%AI9_PrivateDataBegin
some binary private data
%%EOF`;

    const res = extractEpsMetadataAndPreview(Buffer.from(epsContent, 'utf-8'));
    expect(res.thumbnailBase64).toContain('data:image/jpeg;base64,');
    expect(res.hasXmp).toBe(true);
    expect(res.extractedText).toContain('AFFOGATO');
    expect(res.extractedText).toContain('28 ICONS SET');
  });
});

describe('Microstock Forbidden Keywords Sanitization', () => {
  it('strictly filters out forbidden microstock filler words and timestamps', () => {
    const rawKeywords = [
      'affogato',
      'espresso',
      'eps',
      'eps10',
      'stock',
      'commercial',
      'graphic asset',
      'ai',
      'jpg',
      'png',
      '20261010151843',
      'cafe menu',
      'dessert',
    ];

    const sanitized = sanitizeKeywords(rawKeywords, {
      negativeKeywordsFilter: true,
      format: 'eps',
      targetCount: 45,
    });

    expect(sanitized).toContain('affogato');
    expect(sanitized).toContain('espresso');
    expect(sanitized).toContain('cafe menu');
    expect(sanitized).toContain('dessert');

    // Forbidden terms must NOT be present
    expect(sanitized).not.toContain('eps');
    expect(sanitized).not.toContain('eps10');
    expect(sanitized).not.toContain('stock');
    expect(sanitized).not.toContain('commercial');
    expect(sanitized).not.toContain('graphic asset');
    expect(sanitized).not.toContain('ai');
    expect(sanitized).not.toContain('jpg');
    expect(sanitized).not.toContain('png');
    expect(sanitized).not.toContain('20261010151843');
  });
});

describe('Native Binary-Safe EPS XMP Embedding', () => {
  it('Method A: rewrites XMP in-place preserving exact buffer length with whitespace padding', () => {
    const pad = ' '.repeat(2048);
    const epsTemplate = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 100 100
<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">Web</rdf:li></rdf:Alt></dc:title>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
${pad}
<?xpacket end="w"?>
%%EOF`;

    const originalBuf = Buffer.from(epsTemplate, 'utf-8');
    const res = embedEpsMetadata(originalBuf, {
      title: 'Affogato Coffee Dessert 28 Icons Set for Cafe Menu Branding',
      description: 'Vector illustration set of affogato coffee and barista drinks.',
      keywords: ['affogato', 'coffee', 'espresso', 'ice cream', 'gelato', 'cafe menu'],
    });

    expect(res.success).toBe(true);
    expect(res.method).toBe('in-place-padding-preserved');
    expect(res.updatedBuffer.length).toBe(originalBuf.length);

    const updatedText = res.updatedBuffer.toString('utf-8');
    expect(updatedText).toContain('Affogato Coffee Dessert 28 Icons Set');
    expect(updatedText).not.toContain('<rdf:li xml:lang="x-default">Web</rdf:li>');
    expect(updatedText).toContain('<rdf:li>affogato</rdf:li>');
    expect(updatedText).toContain('<rdf:li>espresso</rdf:li>');
  });

  it('Method B: updates 30-byte binary EPS header offsets when packet expands', () => {
    // Construct a minimal Windows binary EPS (header: 0xC5D0D3C6)
    // 30 bytes header
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0xc6d3d0c5, 0); // 0xC5, 0xD0, 0xD3, 0xC6 in little-endian
    header.writeUInt32LE(30, 4);          // PS start
    const dummyPs = `%!PS-Adobe-3.0 EPSF-3.0
<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"></rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
%%EOF`;
    const psBuf = Buffer.from(dummyPs, 'utf-8');
    header.writeUInt32LE(psBuf.length, 8); // PS length
    header.writeUInt32LE(0, 12);           // WMF start
    header.writeUInt32LE(0, 16);           // WMF length
    header.writeUInt32LE(30 + psBuf.length, 20); // TIFF start
    header.writeUInt32LE(100, 24);         // TIFF length
    header.writeUInt16LE(0x1234, 28);      // Checksum

    const dummyTiff = Buffer.alloc(100, 0xaa);
    const fullBinaryEps = Buffer.concat([header, psBuf, dummyTiff]);

    const res = embedEpsMetadata(fullBinaryEps, {
      title: 'Affogato Coffee Dessert 28 Icons Set for Cafe Menu Branding',
      description: 'Rich description of affogato coffee icons.',
      keywords: ['affogato', 'coffee', 'espresso', 'gelato', 'dessert', 'beverage'],
    });

    expect(res.success).toBe(true);
    // Header check
    const updatedHeader = res.updatedBuffer.subarray(0, 30);
    const newPsLength = updatedHeader.readUInt32LE(8);
    const newTiffStart = updatedHeader.readUInt32LE(20);
    const checksum = updatedHeader.readUInt16LE(28);

    expect(newPsLength).toBeGreaterThan(psBuf.length);
    expect(newTiffStart).toBe(30 + newPsLength);
    expect(checksum).toBe(0xffff); // Checksum recalculated/disabled
    expect(res.updatedBuffer.subarray(newTiffStart, newTiffStart + 100).equals(dummyTiff)).toBe(true);
  });
});

describe('File Renaming & CSV Sync Integration', () => {
  it('ensures CSV export filename column matches the SEO filename exactly', () => {
    const file: StockFile = {
      id: 'test-1',
      name: '20261010151843_affogato_coffee.eps',
      format: 'eps',
      size: 50000,
      seoFilename: 'affogato-coffee-dessert-28-icons-set.eps',
      metadata: {
        title: 'Affogato Coffee Dessert 28 Icons Set for Cafe Menu Branding',
        description: 'Comprehensive vector icon set.',
        keywords: ['affogato', 'coffee', 'espresso', 'cafe menu'],
        seoFilename: 'affogato-coffee-dessert-28-icons-set.eps',
        adobeCategoryId: 8,
      },
    };

    const resolved = resolveExportFilename(file, 'adobe_stock');
    expect(resolved).toBe('affogato-coffee-dessert-28-icons-set.eps');

    const csvRes = generateMarketplaceCsv('adobe_stock', [file]);
    expect(csvRes.csvContent).toContain('affogato-coffee-dessert-28-icons-set.eps');
    expect(csvRes.csvContent).not.toContain('20261010151843_affogato_coffee.eps');
  });
});
