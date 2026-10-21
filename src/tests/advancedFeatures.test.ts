import { describe, it, expect, beforeEach } from 'vitest';
import { StockFile } from '../types/stock';
import { evaluateComplianceRisks, COMPLIANCE_LEGAL_DISCLAIMER } from '../services/complianceRiskService';
import {
  canonicalAssetService,
  adaptCanonicalToMarketplace,
  adaptFileToMarketplaces,
} from '../services/canonicalAssetService';
import { MARKETPLACES } from '../config/marketplaces';
import { generateXmpSidecarXml } from '../utils/xmpSidecarGenerator';
import { submissionStore } from '../utils/submissionStore';

describe('Feature 1 — AI Content, Copyright & Trademark Risk Checker', () => {
  it('detects critical trademark violations in title and keywords', () => {
    const fileWithTrademark: StockFile = {
      id: 'tf1',
      name: 'apple_iphone_shot.jpg',
      baseName: 'apple_iphone_shot',
      format: 'jpg',
      size: 1500000,
      lastModified: Date.now(),
      previewUrl: '',
      status: 'ready',
      metadata: {
        title: 'Young woman holding new Apple iPhone 15 Pro',
        description: 'Commercial studio shot of modern smartphone.',
        keywords: ['apple', 'iphone', 'ios', 'smartphone', 'technology', 'gadget', 'screen'],
        primaryCategory: 'Technology',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const report = evaluateComplianceRisks(fileWithTrademark);
    expect(report.overallRisk).toBe('high_risk');
    expect(report.items.some((i) => i.severity === 'CRITICAL')).toBe(true);
    expect(report.items.some((i) => i.category === 'brand_trademark')).toBe(true);
    expect(report.legalDisclaimer).toBe(COMPLIANCE_LEGAL_DISCLAIMER);
  });

  it('detects unreleased recognizable individuals for commercial licensing', () => {
    const fileWithPerson: StockFile = {
      id: 'tf2',
      name: 'portrait_girl.jpg',
      baseName: 'portrait_girl',
      format: 'jpg',
      size: 2000000,
      lastModified: Date.now(),
      previewUrl: '',
      status: 'ready',
      metadata: {
        title: 'Smiling woman drinking coffee in city cafe',
        description: 'Portrait of happy female student in outdoor bistro.',
        keywords: ['woman', 'portrait', 'smile', 'coffee', 'cafe', 'student', 'lifestyle'],
        primaryCategory: 'People',
        containsPeople: true,
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const report = evaluateComplianceRisks(fileWithPerson);
    expect(report.overallRisk).toBe('caution');
    const personRisk = report.items.find((i) => i.category === 'recognizable_person');
    expect(personRisk).toBeDefined();
    expect(personRisk?.remediationAction).toBe('flag_release_required');
  });

  it('clears compliant generic assets without violations', () => {
    const cleanFile: StockFile = {
      id: 'tf3',
      name: 'mountain_lake.jpg',
      baseName: 'mountain_lake',
      format: 'jpg',
      size: 3500000,
      lastModified: Date.now(),
      previewUrl: '',
      status: 'ready',
      metadata: {
        title: 'Serene Alpine Lake Reflection at Dawn with Copy Space',
        description: 'Calm turquoise water reflects snow capped mountain peaks in autumn wilderness.',
        keywords: ['mountain', 'lake', 'reflection', 'alpine', 'wilderness', 'nature', 'landscape', 'calm'],
        primaryCategory: 'Nature',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const report = evaluateComplianceRisks(cleanFile);
    expect(report.overallRisk).toBe('pass');
    expect(report.items.length).toBe(0);
  });
});

describe('Feature 2 — Two-Stage Architecture & Marketplace Adaptation', () => {
  it('computes deterministic content hash and caches analysis', () => {
    const file: StockFile = {
      id: 'tf4',
      name: 'vector_pattern.svg',
      baseName: 'vector_pattern',
      format: 'svg',
      size: 45000,
      lastModified: 1700000000000,
      previewUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
      status: 'ready',
      metadata: {
        title: 'Abstract Geometric Seamless Pattern Vector',
        description: 'Decorative backdrop with modern shapes.',
        keywords: ['pattern', 'geometric', 'seamless', 'vector', 'abstract'],
        primaryCategory: 'Graphic Resources',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const hash1 = canonicalAssetService.computeAssetHash(file);
    const hash2 = canonicalAssetService.computeAssetHash(file);
    expect(hash1).toBe(hash2);
    expect(hash1.startsWith('sha256_')).toBe(true);

    canonicalAssetService.setCachedAnalysis(hash1, {
      assetHash: hash1,
      primarySubject: 'Graphic Resources',
      secondarySubjects: ['Abstract'],
      settingAndBackground: 'Vector Studio',
      moodAndConcept: 'Modern Geometric Design',
      compositionAndLighting: 'Flat Art',
      dominantColors: ['Navy', 'Gold'],
      orientation: 'square',
      contentType: 'vector',
      peopleCount: 0,
      visibleTextOrLabels: [],
      masterTitle: 'Abstract Geometric Seamless Pattern Vector Backdrop',
      masterDescription: 'High resolution vector seamless pattern suitable for wallpapers and textile print.',
      masterKeywords: ['pattern', 'geometric', 'seamless', 'vector', 'abstract', 'textile', 'print', 'wallpaper'],
      timestamp: Date.now(),
    });

    const retrieved = canonicalAssetService.getCachedAnalysis(hash1);
    expect(retrieved).toBeDefined();
    expect(retrieved?.masterTitle).toContain('Abstract Geometric');
  });

  it('adapts canonical metadata to Freepik with semicolon separator', () => {
    const canonical = {
      assetHash: 'hash_test_1',
      primarySubject: 'Nature',
      secondarySubjects: [],
      settingAndBackground: 'Outdoor',
      moodAndConcept: 'Tranquil',
      compositionAndLighting: 'Golden Hour',
      dominantColors: ['Green', 'Gold'],
      orientation: 'horizontal' as const,
      contentType: 'photo' as const,
      peopleCount: 0,
      visibleTextOrLabels: [],
      masterTitle: 'Sunlight Streaming Through Dense Pine Forest Canopy',
      masterDescription: 'Warm rays of morning sun filter through tall trees creating golden haze in woodland.',
      masterKeywords: ['forest', 'pine', 'sunlight', 'morning', 'trees', 'nature', 'landscape', 'rays'],
      timestamp: Date.now(),
    };

    const freepikConfig = MARKETPLACES['freepik'];
    expect(freepikConfig).toBeDefined();

    const adapted = adaptCanonicalToMarketplace(canonical, freepikConfig);
    expect(adapted.delimiter).toBe(';');
    expect(adapted.formattedKeywords).toContain(';');
    expect(adapted.formattedKeywords).toContain('forest; pine; sunlight');
  });

  it('adapts with AI disclosure tags when AI-generated toggle is on', () => {
    const canonical = {
      assetHash: 'hash_ai_1',
      primarySubject: 'Technology',
      secondarySubjects: [],
      settingAndBackground: 'Digital Cyberspace',
      moodAndConcept: 'Futuristic AI Network',
      compositionAndLighting: 'Neon Glow',
      dominantColors: ['Cyan', 'Purple'],
      orientation: 'horizontal' as const,
      contentType: '3d_render' as const,
      peopleCount: 0,
      visibleTextOrLabels: [],
      masterTitle: 'Futuristic Neural Network AI Cyber Brain Concept',
      masterDescription: 'Glowing digital synaptic nodes illustrate artificial intelligence machine learning.',
      masterKeywords: ['neural network', 'ai', 'cyber', 'technology', 'future'],
      timestamp: Date.now(),
    };

    const adobeConfig = MARKETPLACES['adobe_stock'];
    const adapted = adaptCanonicalToMarketplace(canonical, adobeConfig, {
      orderKeywordsByWeight: true,
      autoAppendFormatTags: true,
      negativeKeywordsFilter: true,
      customNegativeKeywords: [],
      keywordTargetCount: 30,
      titleStyle: 'commercial',
      temperature: 0.2,
      selectedModel: 'gemini-2.5-flash',
      aiProvider: 'gemini',
      isAiGeneratedBatch: true,
    });

    expect(adapted.aiDisclosureApplied).toBe(true);
    expect(adapted.keywords).toContain('Generative AI');
  });
});

describe('Feature 3 — XMP Sidecar Generation', () => {
  it('generates standard Adobe RDF/XMP sidecar with escaped XML', () => {
    const xml = generateXmpSidecarXml({
      title: 'Vector Art & Sunset <Minimalist>',
      description: 'A "gorgeous" sunset with copy space & vibrant sky.',
      keywords: ['sunset', 'vector & art', 'minimalist'],
      category: 'Graphic Resources',
      isAiGenerated: true,
    });

    expect(xml).toContain('<?xpacket begin="\uFEFF"');
    expect(xml).toContain('<x:xmpmeta xmlns:x="adobe:ns:meta/"');
    expect(xml).toContain('Vector Art &amp; Sunset &lt;Minimalist&gt;');
    expect(xml).toContain('A &quot;gorgeous&quot; sunset with copy space &amp; vibrant sky.');
    expect(xml).toContain('<rdf:li>vector &amp; art</rdf:li>');
    expect(xml).toContain('<photoshop:Credit>Generative AI Asset</photoshop:Credit>');
    expect(xml).toContain('<?xpacket end="w"?>');
  });
});

describe('Feature 4 — Stock Contributor Submission Tracker Store', () => {
  beforeEach(() => {
    submissionStore.clearAll();
  });

  it('tracks submissions, calculates acceptance rate and user earnings', () => {
    submissionStore.addOrUpdate({
      assetId: 'a1',
      assetName: 'forest.jpg',
      marketplaceId: 'adobe',
      marketplaceName: 'Adobe Stock',
      status: 'accepted',
      earningsUsd: 14.5,
      downloadsCount: 12,
    });

    submissionStore.addOrUpdate({
      assetId: 'a2',
      assetName: 'city.jpg',
      marketplaceId: 'shutterstock',
      marketplaceName: 'Shutterstock',
      status: 'rejected',
      rejectionCategory: 'trademark_ip',
      rejectionNotes: 'Visible logo on billboard',
    });

    submissionStore.addOrUpdate({
      assetId: 'a3',
      assetName: 'sunset.jpg',
      marketplaceId: 'freepik',
      marketplaceName: 'Freepik',
      status: 'submitted',
    });

    const stats = submissionStore.computeStats();
    expect(stats.totalAccepted).toBe(1);
    expect(stats.totalRejected).toBe(1);
    expect(stats.totalSubmitted).toBe(1);
    // Acceptance rate: 1 accepted / (1 accepted + 1 rejected) = 50%
    expect(stats.acceptanceRate).toBe(50);
    expect(stats.totalEarningsUsd).toBe(14.5);
    expect(stats.totalDownloads).toBe(12);

    const rejections = submissionStore.getRejectionBreakdown();
    const trademarkCount = rejections.find((r) => r.category === 'trademark_ip')?.count;
    expect(trademarkCount).toBe(1);
  });

  it('exports and imports JSON backup correctly', () => {
    submissionStore.addOrUpdate({
      assetId: 'b1',
      assetName: 'beach.jpg',
      marketplaceId: 'adobe',
      marketplaceName: 'Adobe Stock',
      status: 'accepted',
      earningsUsd: 5.0,
      downloadsCount: 4,
    });

    const backupJson = submissionStore.exportBackupJson();
    expect(backupJson).toContain('beach.jpg');

    submissionStore.clearAll();
    expect(submissionStore.getAll().length).toBe(0);

    const importSuccess = submissionStore.importBackupJson(backupJson);
    expect(importSuccess).toBe(true);
    expect(submissionStore.getAll().length).toBe(1);
    expect(submissionStore.getAll()[0].assetName).toBe('beach.jpg');
  });
});
