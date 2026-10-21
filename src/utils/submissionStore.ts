import {
  ContributorStats,
  MarketplaceSubmissionRecord,
  RejectionReasonCategory,
  SubmissionStatus,
} from '../types/stock';

const SUBMISSIONS_STORAGE_KEY = 'stockmeta_contributor_submissions_v2.7';

export interface RejectionCategoryStats {
  category: RejectionReasonCategory;
  label: string;
  count: number;
}

export const REJECTION_CATEGORIES: Array<{ id: RejectionReasonCategory; label: string; description: string }> = [
  {
    id: 'technical_quality',
    label: 'Technical Quality',
    description: 'Noise, focus, motion blur, compression artifacts, or overexposure.',
  },
  {
    id: 'trademark_ip',
    label: 'Intellectual Property / Trademark',
    description: 'Visible brand logos, trademarks, protected designs, or copyrighted art.',
  },
  {
    id: 'missing_release',
    label: 'Missing Model / Property Release',
    description: 'Identifiable person, private venue, or protected architecture without release.',
  },
  {
    id: 'metadata_inaccuracy',
    label: 'Metadata / Keyword Spamming',
    description: 'Irrelevant keywords, keyword stuffing, or inaccurate title.',
  },
  {
    id: 'duplicate_similar',
    label: 'Similar / Duplicate Content',
    description: 'Asset is too similar to an existing asset in your portfolio.',
  },
  {
    id: 'editorial_noncompliance',
    label: 'Editorial Non-Compliance',
    description: 'Caption did not follow city/country/date format or lacked editorial value.',
  },
  {
    id: 'other',
    label: 'Other Marketplace Reason',
    description: 'General rejection reason provided by reviewer.',
  },
];

class SubmissionStore {
  private records: MarketplaceSubmissionRecord[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (data) {
        this.records = JSON.parse(data);
      }
    } catch {
      this.records = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(this.records));
    } catch {}
  }

  public getAll(): MarketplaceSubmissionRecord[] {
    return [...this.records];
  }

  public getByAssetId(assetId: string): MarketplaceSubmissionRecord[] {
    return this.records.filter((r) => r.assetId === assetId);
  }

  public addOrUpdate(record: Omit<MarketplaceSubmissionRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): MarketplaceSubmissionRecord {
    const existingIndex = record.id
      ? this.records.findIndex((r) => r.id === record.id)
      : this.records.findIndex((r) => r.assetId === record.assetId && r.marketplaceId === record.marketplaceId);

    const now = Date.now();

    if (existingIndex !== -1) {
      const updated: MarketplaceSubmissionRecord = {
        ...this.records[existingIndex],
        ...record,
        id: this.records[existingIndex].id,
        updatedAt: now,
      };
      this.records[existingIndex] = updated;
      this.save();
      return updated;
    } else {
      const newRecord: MarketplaceSubmissionRecord = {
        ...record,
        id: record.id || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };
      this.records.push(newRecord);
      this.save();
      return newRecord;
    }
  }

  public delete(id: string): void {
    this.records = this.records.filter((r) => r.id !== id);
    this.save();
  }

  public computeStats(): ContributorStats {
    let totalPrepared = 0;
    let totalSubmitted = 0;
    let totalAccepted = 0;
    let totalRejected = 0;
    let totalEarningsUsd = 0;
    let totalDownloads = 0;

    for (const r of this.records) {
      if (r.status === 'prepared') totalPrepared++;
      if (r.status === 'submitted') totalSubmitted++;
      if (r.status === 'accepted') totalAccepted++;
      if (r.status === 'rejected') totalRejected++;
      if (r.earningsUsd && r.earningsUsd > 0) totalEarningsUsd += r.earningsUsd;
      if (r.downloadsCount && r.downloadsCount > 0) totalDownloads += r.downloadsCount;
    }

    const reviewedCount = totalAccepted + totalRejected;
    const acceptanceRate = reviewedCount > 0 ? Math.round((totalAccepted / reviewedCount) * 100) : 0;

    return {
      totalPrepared,
      totalSubmitted,
      totalAccepted,
      totalRejected,
      acceptanceRate,
      totalEarningsUsd: Math.round(totalEarningsUsd * 100) / 100,
      totalDownloads,
    };
  }

  public getRejectionBreakdown(): RejectionCategoryStats[] {
    const counts: Record<RejectionReasonCategory, number> = {
      technical_quality: 0,
      trademark_ip: 0,
      missing_release: 0,
      metadata_inaccuracy: 0,
      duplicate_similar: 0,
      editorial_noncompliance: 0,
      other: 0,
    };

    for (const r of this.records) {
      if (r.status === 'rejected' && r.rejectionCategory) {
        counts[r.rejectionCategory] = (counts[r.rejectionCategory] || 0) + 1;
      }
    }

    return REJECTION_CATEGORIES.map((cat) => ({
      category: cat.id,
      label: cat.label,
      count: counts[cat.id] || 0,
    }));
  }

  public exportBackupJson(): string {
    return JSON.stringify(this.records, null, 2);
  }

  public importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        this.records = parsed;
        this.save();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public clearAll(): void {
    this.records = [];
    this.save();
  }
}

export const submissionStore = new SubmissionStore();
