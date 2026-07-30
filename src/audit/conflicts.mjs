export function detectConflicts(records) {
  const exact = new Map();
  const formReadings = new Map();

  for (const record of records) {
    for (const key of record.keys.formReading) {
      if (!exact.has(key)) exact.set(key, []);
      exact.get(key).push(record.id);
    }
    for (const form of record.keys.forms) {
      if (!formReadings.has(form)) formReadings.set(form, new Set());
      for (const reading of record.keys.readings) formReadings.get(form).add(reading);
    }
  }

  const duplicates = [...exact.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => ({ key, recordIds: [...ids].sort() }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const conflicts = [...formReadings.entries()]
    .filter(([, readings]) => readings.size > 1)
    .map(([form, readings]) => ({ form, readings: [...readings].sort((a, b) => a.localeCompare(b, 'ja')) }))
    .sort((a, b) => a.form.localeCompare(b.form, 'ja'));

  return { duplicates, conflicts };
}

export function createImportDryRun(records, existingRecords = []) {
  const existingKeys = new Set(existingRecords.flatMap((record) => record.keys.formReading));
  const newRecords = records.filter((record) =>
    record.keys.formReading.some((key) => !existingKeys.has(key)));
  const exactDuplicates = records.filter((record) =>
    record.keys.formReading.every((key) => existingKeys.has(key)));
  const analysis = detectConflicts([...existingRecords, ...records]);

  return {
    schemaVersion: '1.0.0',
    mode: 'read-only',
    writesPerformed: 0,
    inspectedRecords: records.length,
    wouldInsert: newRecords.map((record) => record.id).sort(),
    exactDuplicates: exactDuplicates.map((record) => record.id).sort(),
    conflicts: analysis.conflicts,
  };
}
