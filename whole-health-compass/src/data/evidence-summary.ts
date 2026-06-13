// AUTO-GENERATED — do not edit by hand.
// Run `npm run derive:evidence` to regenerate from research/evidence/.
//
// Compliance: this is a back-office AGGREGATE projection of the peer-reviewed
// corpus. It intentionally contains NO study titles, authors, venues, DOIs,
// remedy/supplement names, doses, modality breakdowns, or efficacy claims —
// only concern-level counts, the newest publication year, source names, and a
// neutral deep link to the public Europe PMC search. Concern-level (never
// per-tradition) so no approach is ranked above another. Kept in the content
// linter scope (npm run lint:content) as a standing guarantee.

export interface ConcernEvidenceByType {
  systematicReview: number;
  metaAnalysis: number;
  guideline: number;
  review: number;
}

export interface ConcernEvidence {
  /** peer-reviewed reviews/syntheses that mention this concern */
  reviewCount: number;
  byType: ConcernEvidenceByType;
  /** newest publication year seen across those reviews */
  mostRecentYear: number;
  /** source databases, human-readable */
  sources: string[];
  /** neutral deep link to the public Europe PMC search for this concern */
  searchUrl: string;
}

export interface EvidenceSummary {
  /** ISO timestamp of the underlying harvest */
  harvestedAt: string;
  sources: string[];
  byConcern: Record<string, ConcernEvidence>;
}

export const evidenceSummary: EvidenceSummary = {
  "harvestedAt": "2026-06-13T09:25:45.655Z",
  "sources": [
    "Europe PMC",
    "OpenAlex"
  ],
  "byConcern": {
    "aches-pains": {
      "reviewCount": 39,
      "byType": {
        "systematicReview": 7,
        "metaAnalysis": 13,
        "guideline": 0,
        "review": 19
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22chronic%20musculoskeletal%20pain%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "desk-posture": {
      "reviewCount": 20,
      "byType": {
        "systematicReview": 3,
        "metaAnalysis": 7,
        "guideline": 0,
        "review": 10
      },
      "mostRecentYear": 2025,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22work-related%20neck%20pain%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "digestion": {
      "reviewCount": 53,
      "byType": {
        "systematicReview": 9,
        "metaAnalysis": 17,
        "guideline": 0,
        "review": 27
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22irritable%20bowel%20syndrome%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "headaches": {
      "reviewCount": 39,
      "byType": {
        "systematicReview": 5,
        "metaAnalysis": 14,
        "guideline": 0,
        "review": 20
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22migraine%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "hormonal": {
      "reviewCount": 40,
      "byType": {
        "systematicReview": 6,
        "metaAnalysis": 13,
        "guideline": 1,
        "review": 20
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22menopausal%20symptoms%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "immune": {
      "reviewCount": 16,
      "byType": {
        "systematicReview": 3,
        "metaAnalysis": 2,
        "guideline": 1,
        "review": 10
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22recurrent%20upper%20respiratory%20tract%20infection%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "knee-hip": {
      "reviewCount": 34,
      "byType": {
        "systematicReview": 3,
        "metaAnalysis": 15,
        "guideline": 0,
        "review": 16
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22knee%20osteoarthritis%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "low-back-pain": {
      "reviewCount": 75,
      "byType": {
        "systematicReview": 17,
        "metaAnalysis": 20,
        "guideline": 1,
        "review": 37
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22low%20back%20pain%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "low-energy-sleep": {
      "reviewCount": 56,
      "byType": {
        "systematicReview": 16,
        "metaAnalysis": 11,
        "guideline": 0,
        "review": 29
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22chronic%20insomnia%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "low-mood": {
      "reviewCount": 55,
      "byType": {
        "systematicReview": 0,
        "metaAnalysis": 26,
        "guideline": 0,
        "review": 29
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22depression%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "neck-shoulder": {
      "reviewCount": 28,
      "byType": {
        "systematicReview": 6,
        "metaAnalysis": 7,
        "guideline": 0,
        "review": 15
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22mechanical%20neck%20pain%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "recurrent-strain": {
      "reviewCount": 20,
      "byType": {
        "systematicReview": 2,
        "metaAnalysis": 8,
        "guideline": 0,
        "review": 10
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22tendinopathy%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    },
    "stress-anxiety": {
      "reviewCount": 54,
      "byType": {
        "systematicReview": 9,
        "metaAnalysis": 18,
        "guideline": 0,
        "review": 27
      },
      "mostRecentYear": 2026,
      "sources": [
        "Europe PMC",
        "OpenAlex"
      ],
      "searchUrl": "https://europepmc.org/search?query=%22generalised%20anxiety%20disorder%22%20AND%20(PUB_TYPE%3A%22systematic-review%22%20OR%20PUB_TYPE%3A%22meta-analysis%22%20OR%20PUB_TYPE%3A%22guideline%22)"
    }
  }
};

/** Aggregate evidence for a concern id, or undefined if none was harvested. */
export function getConcernEvidence(concernId: string): ConcernEvidence | undefined {
  return evidenceSummary.byConcern[concernId];
}
