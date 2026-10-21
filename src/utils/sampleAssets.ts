import { StockFile } from '../types/stock';

/**
 * Creates high-quality mock data and canvas-generated data URLs
 * for immediate interactive testing of all formats.
 */
function createSvgDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="50%" stop-color="#312e81"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ec4899"/>
        <stop offset="100%" stop-color="#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg)"/>
    <circle cx="200" cy="200" r="140" fill="url(#grad1)" opacity="0.8"/>
    <polygon points="450,120 620,400 320,420" fill="url(#grad2)" opacity="0.85"/>
    <circle cx="600" cy="350" r="90" fill="#f59e0b" opacity="0.75"/>
    <path d="M 100 500 Q 400 300 700 520" stroke="#10b981" stroke-width="12" fill="none" opacity="0.9"/>
    <text x="400" y="550" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" letter-spacing="2">MODERN ABSTRACT GEOMETRIC VECTOR</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createEpsSampleContent(): string {
  return `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: StockMeta Pro Vector Studio
%%Title: Vintage Artisan Coffee Badge Vector
%%BoundingBox: 0 0 500 500
%%Pages: 1
%%EndComments
%%BeginProlog
/inch {72 mul} def
%%EndProlog
gsave
0 0 500 500 rectclip
0.1 0.1 0.15 setrgbcolor
0 0 500 500 rectfill
0.85 0.65 0.25 setrgbcolor
250 250 180 0 360 arc fill
0.1 0.1 0.15 setrgbcolor
250 250 160 0 360 arc fill
0.9 0.85 0.75 setrgbcolor
/Helvetica-Bold findfont 28 scalefont setfont
140 240 moveto (PREMIUM COFFEE) show
grestore
%%EOF`;
}

function createPhotoCanvasDataUri(theme: 'mountain' | 'tech' | 'video'): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (theme === 'mountain') {
    // Sunset mountain landscape
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
    skyGrad.addColorStop(0, '#f97316');
    skyGrad.addColorStop(0.4, '#fb923c');
    skyGrad.addColorStop(0.7, '#f43f5e');
    skyGrad.addColorStop(1, '#6366f1');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Sun
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(400, 260, 60, 0, Math.PI * 2);
    ctx.fill();

    // Mountains back
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.moveTo(0, 450);
    ctx.lineTo(180, 220);
    ctx.lineTo(360, 420);
    ctx.lineTo(520, 260);
    ctx.lineTo(800, 460);
    ctx.lineTo(800, 600);
    ctx.lineTo(0, 600);
    ctx.fill();

    // Mountains front
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(260, 310);
    ctx.lineTo(440, 460);
    ctx.lineTo(650, 330);
    ctx.lineTo(800, 490);
    ctx.lineTo(800, 600);
    ctx.lineTo(0, 600);
    ctx.fill();

    // Lake water reflection
    const waterGrad = ctx.createLinearGradient(0, 450, 0, 600);
    waterGrad.addColorStop(0, '#312e81');
    waterGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 480, 800, 120);

    // Lake ripples
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.4)';
    ctx.lineWidth = 2;
    for (let y = 490; y < 590; y += 12) {
      ctx.beginPath();
      ctx.moveTo(250 + Math.sin(y) * 40, y);
      ctx.lineTo(550 + Math.cos(y) * 40, y);
      ctx.stroke();
    }
  } else if (theme === 'tech') {
    // 3D Isometric Tech Cube
    ctx.clearRect(0, 0, 800, 600);
    // Transparent or dark grid
    const darkGrad = ctx.createRadialGradient(400, 300, 50, 400, 300, 400);
    darkGrad.addColorStop(0, '#1e293b');
    darkGrad.addColorStop(1, '#020617');
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Glowing cube
    const cx = 400;
    const cy = 300;
    const size = 120;

    // Top face
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.866, cy - size * 0.5);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx - size * 0.866, cy - size * 0.5);
    ctx.closePath();
    ctx.fill();

    // Left face
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.866, cy - size * 0.5);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.866, cy + size * 0.5);
    ctx.closePath();
    ctx.fill();

    // Right face
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + size * 0.866, cy - size * 0.5);
    ctx.lineTo(cx + size * 0.866, cy + size * 0.5);
    ctx.lineTo(cx, cy + size);
    ctx.closePath();
    ctx.fill();

    // Glow accents
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (theme === 'video') {
    // 3-panel horizontal motion storyboard
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 800, 600);
    // Draw retrowave synth grid tunnel
    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, '#581c87');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(40, 40, 720, 520);

    // Glowing wireframe grid
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    for (let x = 60; x <= 740; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x + (x - 400) * 0.4, 560);
      ctx.stroke();
    }
    for (let y = 100; y <= 560; y += 45) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(760, y);
      ctx.stroke();
    }
    // Neon title text
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('4K MOTION LOOP STORYBOARD', 400, 300);
  }

  return canvas.toDataURL('image/png');
}

export function generateSampleStockFiles(): StockFile[] {
  const now = Date.now();
  const svgData = createSvgDataUri();
  const mountainPhoto = typeof window !== 'undefined' ? createPhotoCanvasDataUri('mountain') : '';
  const tech3d = typeof window !== 'undefined' ? createPhotoCanvasDataUri('tech') : '';
  const videoStoryboard = typeof window !== 'undefined' ? createPhotoCanvasDataUri('video') : '';

  return [
    {
      id: 'sample-1-svg',
      name: 'abstract-geometric-banner.svg',
      baseName: 'abstract-geometric-banner',
      format: 'svg',
      size: 42800,
      lastModified: now - 3600000 * 2,
      previewUrl: svgData,
      thumbnailBase64: svgData,
      dimensions: { width: 800, height: 600 },
      status: 'ready',
      metadata: {
        title: 'Modern Abstract Geometric Vector Banner with Colorful Gradient Shapes and Fluid Lines',
        description: 'Vibrant geometric background with layered circles, triangles and dynamic glowing curves. Perfect for digital marketing, tech branding, website header, and futuristic presentation covers.',
        keywords: [
          'geometric', 'abstract', 'vector', 'banner', 'shapes', 'gradient', 'background', 'modern',
          'colorful', 'fluid', 'futuristic', 'graphic', 'design', 'presentation', 'triangle', 'circle',
          'curves', 'digital', 'wallpaper', 'cover', 'template', 'technology', 'creative', 'minimalist',
          'illustration', 'isolated', 'dynamic', 'vibrant', 'poster', 'decorative', 'art', 'layout',
          'element', 'flow', 'wave', 'trend', 'cool', 'concept', 'backdrop', 'header'
        ],
        primaryCategory: 'Graphic Resources & Vectors',
        secondaryCategory: 'Abstract & Backgrounds',
        adobeCategoryId: 8,
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    },
    {
      id: 'sample-2-jpg',
      name: 'mountain-lake-sunset-scenic.jpg',
      baseName: 'mountain-lake-sunset-scenic',
      format: 'jpg',
      size: 3450000,
      lastModified: now - 3600000 * 12,
      previewUrl: mountainPhoto,
      thumbnailBase64: mountainPhoto,
      dimensions: { width: 5400, height: 3600 },
      status: 'ready',
      metadata: {
        title: 'Majestic Mountain Range Reflecting in Calm Alpine Lake During Vibrant Golden Hour Sunset',
        description: 'Serene scenic wilderness view of high jagged peaks silhouetted against glowing orange and purple evening sky. Peaceful water reflections and untouched natural travel destination with copy space.',
        keywords: [
          'mountain', 'lake', 'sunset', 'reflection', 'nature', 'landscape', 'water', 'sky',
          'alpine', 'wilderness', 'scenic', 'peaceful', 'travel', 'calm', 'peaks', 'outdoor',
          'golden hour', 'evening', 'serene', 'tranquil', 'panorama', 'national park', 'horizon', 'dramatic',
          'vacation', 'destination', 'silhouette', 'twilight', 'fresh', 'environment', 'eco', 'earth',
          'adventure', 'wanderlust', 'photography', 'clean air', 'hiking', 'tourism', 'view'
        ],
        primaryCategory: 'Nature & Landscapes',
        secondaryCategory: 'Travel & Destinations',
        adobeCategoryId: 11,
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    },
    {
      id: 'sample-3-png',
      name: 'isometric-cyber-data-cube.png',
      baseName: 'isometric-cyber-data-cube',
      format: 'png',
      size: 890000,
      lastModified: now - 3600000 * 5,
      previewUrl: tech3d,
      thumbnailBase64: tech3d,
      dimensions: { width: 2400, height: 2400 },
      status: 'ready',
      metadata: {
        title: 'Isometric 3D Glowing Cyber Data Cube Icon for Cloud Computing and Blockchain Tech',
        description: 'Futuristic digital block symbol with neon cyan and blue luminescent edge lighting. Isolated high-tech crypto server asset for fintech presentations, SaaS dashboards, and UI web design.',
        keywords: [
          'isometric', 'cube', 'blockchain', 'data', 'cloud computing', 'crypto', 'technology', 'futuristic',
          'icon', 'fintech', 'cyber', 'digital', 'server', 'network', 'render', 'asset',
          '3d element', 'infrastructure', 'software', 'storage', 'cryptocurrency', 'isolated', 'smart contract', 'tech',
          'glowing', 'cyan', 'blue', 'modern', 'virtual', 'symbol', 'concept', 'innovation',
          'big data', 'security', 'database', 'ai', 'algorithm', 'system', 'clean', 'transparent background'
        ],
        primaryCategory: 'Science & Technology',
        secondaryCategory: 'Illustrations & Icons',
        adobeCategoryId: 19,
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    },
    {
      id: 'sample-4-eps',
      name: 'vintage-artisan-coffee-badge.eps',
      baseName: 'vintage-artisan-coffee-badge',
      format: 'eps',
      size: 154000,
      lastModified: now - 3600000 * 24,
      previewUrl: svgData, // fallback vector preview
      thumbnailBase64: svgData,
      dimensions: { width: 3000, height: 3000 },
      status: 'idle',
      metadata: {
        title: 'Retro Vintage Artisan Coffee Roastery Circular Emblem Badge and Logo Template',
        description: 'Vector seal emblem with traditional typography and coffee cup icon. Editable vector artwork suitable for cafe branding, craft packaging, t-shirt printing, and restaurant menu design.',
        keywords: [
          'coffee', 'badge', 'vintage', 'retro', 'emblem', 'roastery', 'cafe', 'artisan',
          'logo', 'label', 'stamp', 'vector', 'typography', 'branding', 'cup', 'beans',
          'espresso', 'drink', 'beverage', 'barista', 'craft', 'restaurant', 'menu', 't-shirt',
          'isolated', 'graphic', 'symbol', 'insignia', 'organic', 'morning', 'caffeine', 'sign'
        ],
        primaryCategory: 'Food & Drink',
        secondaryCategory: 'Graphic Resources & Vectors',
        adobeCategoryId: 7,
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    },
    {
      id: 'sample-5-mp4',
      name: 'futuristic-cyber-grid-tunnel-loop.mp4',
      baseName: 'futuristic-cyber-grid-tunnel-loop',
      format: 'mp4',
      size: 14200000,
      lastModified: now - 3600000 * 48,
      previewUrl: videoStoryboard,
      thumbnailBase64: videoStoryboard,
      dimensions: { width: 3840, height: 2160 },
      duration: 15.0,
      status: 'idle',
      metadata: {
        title: 'Seamless Looping Neon Cyber Wireframe Grid Tunnel Motion Graphics Background 4K',
        description: 'Fast flying through synthwave retrowave perspective grid with glowing violet lines and particles. High-energy endless loop footage for VJ performance, music video, gaming stream, and intro.',
        keywords: [
          'loop', 'tunnel', 'grid', 'neon', 'wireframe', 'cyber', 'retro', 'synthwave',
          'motion graphic', 'background', '4k', 'animation', 'futuristic', 'vj', 'stage', 'virtual reality',
          'scifi', 'speed', 'flight', 'flying', 'stream', 'game', 'gaming', 'violet',
          'purple', 'glow', 'seamless loop', 'intro', 'electronic music', 'perspective', 'lines', 'abstract'
        ],
        primaryCategory: 'Video & Motion Graphics',
        secondaryCategory: 'Abstract & Backgrounds',
        adobeCategoryId: 19,
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    },
  ];
}
