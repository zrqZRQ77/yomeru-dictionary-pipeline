import { XMLParser } from 'fast-xml-parser';

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (value && typeof value === 'object' && '#text' in value) return String(value['#text']).trim();
  return '';
}

export function parseJmdictXml(xml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    trimValues: true,
    processEntities: false,
  });
  const parsed = parser.parse(xml);
  const entries = asArray(parsed?.JMdict?.entry);
  if (entries.length === 0) throw new Error('No JMdict entries found');

  return entries.map((entry) => {
    const writtenForms = asArray(entry.k_ele).map((item) => text(item?.keb)).filter(Boolean);
    const readingElements = asArray(entry.r_ele);
    const readings = readingElements.map((item) => text(item?.reb)).filter(Boolean);
    const senses = asArray(entry.sense).map((sense) => {
      const glossItems = asArray(sense.gloss);
      return {
        partOfSpeech: asArray(sense.pos).map(text).filter(Boolean),
        glosses: glossItems.map(text).filter(Boolean),
        languages: glossItems.map((item) => item?.['@_xml:lang'] || 'eng'),
      };
    }).filter((sense) => sense.glosses.length > 0);

    const fallbackForm = readings[0];
    if (writtenForms.length === 0 && fallbackForm) writtenForms.push(fallbackForm);
    if (!fallbackForm || writtenForms.length === 0 || senses.length === 0) {
      throw new Error(`Incomplete JMdict entry: ${text(entry.ent_seq) || 'unknown'}`);
    }

    return {
      sourceRecordId: text(entry.ent_seq),
      writtenForms,
      readings,
      senses,
    };
  });
}
