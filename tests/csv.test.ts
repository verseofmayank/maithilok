import test from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../lib/csv';

test('CSV keeps commas, quotes and line breaks inside quoted cells', () => {
  assert.equal(
    toCsv([['A, B', 'Said "yes"', 'line\nbreak']]),
    '"A, B","Said ""yes""","line\nbreak"',
  );
});
test('CSV neutralizes spreadsheet formula injection in exported log values', () => {
  for (const value of ['=HYPERLINK("bad")', '+123', '-1+2', '@SUM(A1)', '  =1+2', '\tformula'])
    assert(toCsv([[value]]).startsWith('"\''));
  assert.equal(toCsv([['Maithilok', null]]), '"Maithilok",""');
});
