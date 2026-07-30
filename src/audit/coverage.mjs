import { formReadingKey, normalizeForm, normalizeReading } from '../normalize/lexical-record.mjs';

function percentage(numerator, denominator) {
  return denominator === 0 ? 0 : Number(((numerator / denominator) * 100).toFixed(4));
}

function buildIndex(records) {
  const exact = new Map();
  const forms = new Map();
  for (const record of records) {
    for (const key of record.keys.formReading) {
      if (!exact.has(key)) exact.set(key, []);
      exact.get(key).push(record.id);
    }
    for (const form of record.keys.forms) {
      if (!forms.has(form)) forms.set(form, new Set());
      for (const reading of record.keys.readings) forms.get(form).add(reading);
    }
  }
  return { exact, forms };
}

function tokenRiskFlags(token, index) {
  const surface = normalizeForm(token.surface || '');
  const basic = normalizeForm(token.basic || surface);
  const reading = normalizeReading(token.reading || '');
  const flags = [];
  if (!reading) flags.push('missing-reading');
  if (/proper/i.test(token.pos || '')) flags.push('proper-noun');
  const knownReadings = new Set([...(index.forms.get(surface) || []), ...(index.forms.get(basic) || [])]);
  if (knownReadings.size > 0 && !knownReadings.has(reading)) flags.push('form-reading-conflict');
  if (/^[ぁ-ゖァ-ヶー]$/.test(surface)) flags.push('single-kana-fragment');
  return [...new Set(flags)].sort();
}

export function auditCoverage(records, corpus) {
  if (!Array.isArray(corpus?.documents)) throw new Error('Corpus must contain a documents array');
  const index = buildIndex(records);
  const gaps = new Map();
  const splitMetrics = new Map();
  let totalTokens = 0;
  let hits = 0;

  for (const document of [...corpus.documents].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!['development', 'evaluation'].includes(document.split)) {
      throw new Error(`Invalid corpus split: ${document.split}`);
    }
    if (!Array.isArray(document.tokens)) throw new Error(`Document ${document.id} has no tokens array`);
    if (!splitMetrics.has(document.split)) splitMetrics.set(document.split, { tokens: 0, hits: 0, misses: 0 });
    const split = splitMetrics.get(document.split);

    for (const token of document.tokens) {
      totalTokens += 1;
      split.tokens += 1;
      const surface = normalizeForm(token.surface || '');
      const basic = normalizeForm(token.basic || surface);
      const reading = normalizeReading(token.reading || '');
      const keys = [...new Set([formReadingKey(surface, reading), formReadingKey(basic, reading)])];
      const matched = keys.some((key) => index.exact.has(key));
      if (matched) {
        hits += 1;
        split.hits += 1;
        continue;
      }

      split.misses += 1;
      const candidateForm = basic || surface;
      const gapKey = formReadingKey(candidateForm, reading);
      if (!gaps.has(gapKey)) {
        gaps.set(gapKey, {
          key: gapKey,
          form: candidateForm,
          reading,
          occurrences: 0,
          documentIds: new Set(),
          splits: new Set(),
          partOfSpeech: new Set(),
          riskFlags: new Set(),
          evidenceBySplit: new Map(),
        });
      }
      const gap = gaps.get(gapKey);
      gap.occurrences += 1;
      gap.documentIds.add(document.id);
      gap.splits.add(document.split);
      if (!gap.evidenceBySplit.has(document.split)) {
        gap.evidenceBySplit.set(document.split, { occurrences: 0, documentIds: new Set() });
      }
      const evidence = gap.evidenceBySplit.get(document.split);
      evidence.occurrences += 1;
      evidence.documentIds.add(document.id);
      if (token.pos) gap.partOfSpeech.add(String(token.pos));
      for (const flag of tokenRiskFlags(token, index)) gap.riskFlags.add(flag);
    }
  }

  const misses = totalTokens - hits;
  const normalizedSplits = Object.fromEntries(
    [...splitMetrics.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, metric]) => [name, {
      ...metric,
      coveragePercent: percentage(metric.hits, metric.tokens),
    }]),
  );

  return {
    schemaVersion: '1.0.0',
    methodology: 'exact normalized form-plus-reading match',
    totalDocuments: corpus.documents.length,
    totalTokens,
    hits,
    misses,
    coveragePercent: percentage(hits, totalTokens),
    splits: normalizedSplits,
    gaps: [...gaps.values()].map((gap) => ({
      ...gap,
      documentIds: [...gap.documentIds].sort(),
      splits: [...gap.splits].sort(),
      partOfSpeech: [...gap.partOfSpeech].sort(),
      riskFlags: [...gap.riskFlags].sort(),
      evidenceBySplit: Object.fromEntries(
        [...gap.evidenceBySplit.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, evidence]) => [name, {
          occurrences: evidence.occurrences,
          documentIds: [...evidence.documentIds].sort(),
        }]),
      ),
    })).sort((a, b) => b.occurrences - a.occurrences || a.key.localeCompare(b.key)),
  };
}
