import * as assert from 'assert';
import { suite, test } from 'mocha';
import { sanitizeId } from '../../utils/id';

suite('sanitizeId', () => {
  test('sanitizes spaces and punctuation', () => {
    assert.strictEqual(sanitizeId('Web Client!'), 'Web_Client');
  });

  test('prefixes numeric identifiers', () => {
    assert.strictEqual(sanitizeId('123 service'), 'n_123_service');
  });

  test('returns fallback for empty input', () => {
    assert.strictEqual(sanitizeId('   '), 'node');
  });
});
