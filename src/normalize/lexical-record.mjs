function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja'));
}

export function normalizeForm(value) {
  return String(value).normalize('NFKC').trim();
}

export function normalizeReading(value) {
  return normalizeForm(value).replace(/[ァ-ヶ]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 0x60));
}

export function formReadingKey(form, reading) {
  return `${normalizeForm(form)}\u0000${normalizeReading(reading)}`;
}

export function normalizeLexicalEntry(entry, sourceId) {
  const writtenForms = uniqueSorted(entry.writtenForms.map(normalizeForm));
  const readings = uniqueSorted(entry.readings.map(normalizeReading));
  const primaryForm = writtenForms[0];
  const primaryReading = readings[0];
  const partOfSpeech = uniqueSorted(entry.senses.flatMap((sense) => sense.partOfSpeech || []));
  const senses = entry.senses.map((sense) => ({
    glosses: uniqueSorted(sense.glosses.map(normalizeForm)),
    languages: uniqueSorted((sense.languages || []).map(normalizeForm)),
  })).sort((a, b) => a.glosses.join('\u0000').localeCompare(b.glosses.join('\u0000')));

  const formReading = uniqueSorted(
    writtenForms.flatMap((form) => readings.map((reading) => formReadingKey(form, reading))),
  );

  return {
    schemaVersion: '1.0.0',
    id: `lex-${sourceId}-${entry.sourceRecordId}`,
    primaryForm,
    primaryReading,
    writtenForms,
    readings,
    partOfSpeech,
    senses,
    keys: {
      forms: writtenForms,
      readings,
      formReading,
    },
    sourceRefs: [{ sourceId, sourceRecordId: entry.sourceRecordId }],
    transformations: [
      'Unicode NFKC normalization',
      'Katakana readings normalized to hiragana',
      'Forms, readings, parts of speech, and glosses deduplicated and sorted',
    ],
  };
}

export function normalizeLexicalEntries(entries, sourceId) {
  return entries
    .map((entry) => normalizeLexicalEntry(entry, sourceId))
    .sort((a, b) => a.id.localeCompare(b.id));
}
