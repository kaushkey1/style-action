import { describe, expect, it } from 'vitest';

import { StyleActionsApiError, isPathCode, pathCode } from '@/modules/style-actions-product/api/client';
import { errorSentence, failureText, fallbackDepthText } from '@/modules/style-actions-product/components/display';
import { MAX_PAGE, parsePage } from '@/modules/style-actions-product/components/useWorkspaceParams';

describe('path codes (S2-C66 L7)', () => {
  it('accepts the codes the data uses', () => {
    for (const code of ['snap_01054c103f43', 'snap_legacy_0922', 'S3KG', 'V012', '8080', 'TX3X', '700000001_BLU', 'GRY', 'a-b']) expect(isPathCode(code)).toBe(true);
  });

  it('rejects dot segments, separators, encodings, blanks and over-long codes', () => {
    for (const code of ['..', '.', 'a.b', '../x', 'a/b', 'a%2Fb', '%2e%2e', ' ', '', 'a b', 'x'.repeat(81)]) expect(isPathCode(code)).toBe(false);
    expect(isPathCode(null)).toBe(false);
    expect(isPathCode(undefined)).toBe(false);
  });

  it('fails an invalid code as the not-found the backend would give, without echoing it', () => {
    expect(pathCode('8080', 'store')).toBe('8080');
    expect(() => pathCode('..', 'store')).toThrow(StyleActionsApiError);
    try {
      pathCode('../health', 'option');
    } catch (error) {
      expect(error).toBeInstanceOf(StyleActionsApiError);
      expect((error as StyleActionsApiError).status).toBe(404);
      expect((error as StyleActionsApiError).code).toBe('option_store_not_found');
      expect((error as StyleActionsApiError).message).not.toContain('..');
    }
    expect(() => pathCode(null, 'snapshot')).toThrow(/snapshot code is not valid/);
    expect(() => pathCode('.', 'dc')).toThrow(/Distribution Centre code is not valid/);
  });
});

describe('page parameters (S2-C66 L1)', () => {
  it('clamps pages read from the URL to 1..10000 and ignores what is not a whole number', () => {
    expect(MAX_PAGE).toBe(10000);
    expect(parsePage('3')).toBe(3);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-5')).toBe(1);
    expect(parsePage('10001')).toBe(10000);
    expect(parsePage('99999999999')).toBe(10000);
    expect(parsePage('2.5')).toBeNull();
    expect(parsePage('abc')).toBeNull();
    expect(parsePage('')).toBeNull();
    expect(parsePage(null)).toBeNull();
  });
});

describe('failure and error copy (S2-C66 L2, S2-C67 L3)', () => {
  it('shows fixed copy for a failed build or extension, never the raw error', () => {
    expect(failureText('interrupted_by_restart')).toBe('It was interrupted by a server restart. Start it again.');
    expect(failureText('interrupted by restart')).toBe('It was interrupted by a server restart. Start it again.');
    expect(failureText('ProgrammingError: relation "x" does not exist')).toBe('It stopped with an error; the server log has the details.');
    expect(failureText(null)).toBeNull();
  });

  it('turns a backend error into one sentence with a full stop and keeps the code apart', () => {
    expect(errorSentence(new StyleActionsApiError(404, { code: 'dc_not_found', message: 'DC N4DC is not in this snapshot' }))).toEqual({
      sentence: 'DC N4DC is not in this snapshot.',
      code: 'dc_not_found',
    });
    expect(errorSentence(new StyleActionsApiError(500, { code: 'x', message: 'Done.' })).sentence).toBe('Done.');
    expect(errorSentence(new Error('network'))).toEqual({ sentence: 'The Style Actions backend could not be reached.', code: null });
  });

  it('reads the fallback depth from the group (S2-C67 L6)', () => {
    expect(fallbackDepthText(9.25)).toBe('Plan qty estimated (9.25 per option)');
    expect(fallbackDepthText(null)).toBe('Plan qty estimated from the default depth');
  });
});
