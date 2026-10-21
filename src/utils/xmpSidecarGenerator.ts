/**
 * Utility to generate standard Adobe-compliant XMP Sidecar files (.xmp)
 * for stock marketplace submissions and legacy vector/video sidecars.
 */

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateXmpSidecarXml(options: {
  title: string;
  description: string;
  keywords: string[];
  category?: string;
  isAiGenerated?: boolean;
}): string {
  const { title, description, keywords, category = 'Graphic Resources', isAiGenerated = false } = options;

  const keywordsXml = keywords
    .map((k) => `          <rdf:li>${escapeXml(k)}</rdf:li>`)
    .join('\n');

  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 7.1-c000">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(description)}</rdf:li>
        </rdf:Alt>
      </dc:description>
      <dc:subject>
        <rdf:Bag>
${keywordsXml}
        </rdf:Bag>
      </dc:subject>
      <photoshop:Headline>${escapeXml(title)}</photoshop:Headline>
      <photoshop:Category>${escapeXml(category)}</photoshop:Category>
      ${isAiGenerated ? '<photoshop:Credit>Generative AI Asset</photoshop:Credit>' : ''}
      <xmp:CreatorTool>StockMeta Pro Studio v2.7</xmp:CreatorTool>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Trigger immediate browser download of an XMP sidecar file
 */
export function downloadXmpSidecar(filename: string, xmlContent: string): void {
  const blob = new Blob([xmlContent], { type: 'application/rdf+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const baseName = filename.replace(/\.[^/.]+$/, '');
  a.href = url;
  a.download = `${baseName}.xmp`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
