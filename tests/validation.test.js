import assert from 'node:assert/strict';
import test from 'node:test';

import { formatBrazilianPhone } from '../src/lib/validation.js';

test('formata a digitação nacional sem reinterpretar o DDI +55 como DDD', () => {
  let displayedValue = '';

  for (const digit of '81987654321') {
    displayedValue = formatBrazilianPhone(`${displayedValue}${digit}`);
  }

  assert.equal(displayedValue, '(81) 98765-4321');
});

test('remove o DDI ao colar um telefone brasileiro completo', () => {
  assert.equal(formatBrazilianPhone('+55 81 98765-4321'), '(81) 98765-4321');
});
