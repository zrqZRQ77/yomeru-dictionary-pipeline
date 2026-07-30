function riskLevel(flags) {
  const highRisk = new Set(['missing-reading', 'proper-noun', 'form-reading-conflict', 'single-kana-fragment']);
  return flags.some((flag) => highRisk.has(flag)) ? 'high' : 'standard';
}

function priority(occurrences) {
  if (occurrences >= 5) return 'P0';
  if (occurrences >= 2) return 'P1';
  return 'P2';
}

export function buildCandidateQueue(coverageReport) {
  const candidates = coverageReport.gaps
    .filter((gap) => gap.evidenceBySplit?.development)
    .map((gap) => {
      const evidence = gap.evidenceBySplit.development;
      return {
        schemaVersion: '1.0.0',
        candidateId: `candidate-${Buffer.from(gap.key).toString('hex').slice(0, 32)}`,
        lexicalKey: gap.key,
        form: gap.form,
        reading: gap.reading,
        priority: priority(evidence.occurrences),
        riskLevel: riskLevel(gap.riskFlags),
        riskFlags: gap.riskFlags,
        partOfSpeech: gap.partOfSpeech,
        developmentEvidence: {
          occurrences: evidence.occurrences,
          documentIds: evidence.documentIds,
        },
        status: 'candidate',
        publishable: false,
      };
    })
    .sort((a, b) => {
      const order = { P0: 0, P1: 1, P2: 2 };
      return order[a.priority] - order[b.priority]
        || b.developmentEvidence.occurrences - a.developmentEvidence.occurrences
        || a.lexicalKey.localeCompare(b.lexicalKey);
    });

  return {
    schemaVersion: '1.0.0',
    candidateGenerationSplit: 'development',
    evaluationUsedForRanking: false,
    totalCandidates: candidates.length,
    candidates,
  };
}
