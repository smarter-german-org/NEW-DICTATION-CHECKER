import { 
  normalizeGermanText,
  normalizeText,
  levenshteinDistance,
  areSimilarWords,
  isPartOfCompoundWord,
  alignWords
} from '../textUtils';

// normalizeGermanText tests
describe('normalizeGermanText', () => {
  test('handles umlaut alternatives', () => {
    expect(normalizeGermanText('schoener')).toBe('schöner');
    expect(normalizeGermanText('schoen')).toBe('schön');
    expect(normalizeGermanText('buero')).toBe('büro');
  });

  test('preserves case when requested', () => {
    expect(normalizeGermanText('Schoener', true)).toBe('Schöner');
    expect(normalizeGermanText('schoener', false)).toBe('schöner');
  });
});

// levenshteinDistance tests
describe('levenshteinDistance', () => {
  test('calculates correct distance between similar words', () => {
    expect(levenshteinDistance('house', 'mouse')).toBe(1);
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
  });

  test('handles empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
    expect(levenshteinDistance('word', '')).toBe(4);
    expect(levenshteinDistance('', 'word')).toBe(4);
  });
});

// areSimilarWords tests
describe('areSimilarWords', () => {
  test('correctly identifies similar words', () => {
    expect(areSimilarWords('house', 'house')).toBe(true);
    expect(areSimilarWords('house', 'mouse')).toBe(true);
    expect(areSimilarWords('schön', 'schon')).toBe(true);
  });

  test('correctly identifies dissimilar words', () => {
    expect(areSimilarWords('house', 'elephant')).toBe(false);
    expect(areSimilarWords('berlin', 'munich')).toBe(false);
  });
});

// alignWords tests
describe('alignWords', () => {
  test('correctly aligns exactly matching words', () => {
    const reference = ['hello', 'world'];
    const user = ['hello', 'world'];
    const alignment = alignWords(reference, user);
    
    expect(alignment.length).toBe(2);
    expect(alignment[0].op).toBe('match');
    expect(alignment[1].op).toBe('match');
  });

  test('handles missing words', () => {
    const reference = ['hello', 'beautiful', 'world'];
    const user = ['hello', 'world'];
    const alignment = alignWords(reference, user);
    
    expect(alignment.length).toBe(3);
    expect(alignment[0].op).toBe('match');
    expect(alignment[1].op).toBe('del');
    expect(alignment[2].op).toBe('match');
  });

  test('handles extra words', () => {
    const reference = ['hello', 'world'];
    const user = ['hello', 'beautiful', 'world'];
    const alignment = alignWords(reference, user);
    
    expect(alignment.length).toBe(3);
    expect(alignment[0].op).toBe('match');
    expect(alignment[1].op).toBe('ins');
    expect(alignment[2].op).toBe('match');
  });

  test('respects capitalization when enabled', () => {
    const reference = ['Hello', 'World'];
    const user = ['hello', 'world'];
    
    // When capitalization is checked
    const alignmentWithCaps = alignWords(reference, user, true);
    expect(alignmentWithCaps[0].op).toBe('sub');
    expect(alignmentWithCaps[1].op).toBe('sub');
    
    // When capitalization is ignored
    const alignmentNoCaps = alignWords(reference, user, false);
    expect(alignmentNoCaps[0].op).toBe('match');
    expect(alignmentNoCaps[1].op).toBe('match');
  });
}); 