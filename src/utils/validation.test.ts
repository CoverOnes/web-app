import { describe, it, expect } from 'vitest';
import {
  validateLegalName,
  validateNationalId,
  validateBusinessId,
  validateCompanyName,
  validatePassword,
} from './validation';

describe('validateLegalName', () => {
  it('accepts a normal name', () => {
    expect(validateLegalName('王小明')).toBeNull();
  });
  it('rejects empty / whitespace-only', () => {
    expect(validateLegalName('   ')).not.toBeNull();
  });
  it('rejects > 100 chars', () => {
    expect(validateLegalName('a'.repeat(101))).not.toBeNull();
  });
});

describe('validateNationalId (TW checksum)', () => {
  it('accepts valid IDs that pass the checksum', () => {
    // A123456789 is a well-known valid TW ID checksum fixture.
    expect(validateNationalId('A123456789')).toBeNull();
    // lower-case is normalised to upper-case before validation
    expect(validateNationalId('a123456789')).toBeNull();
  });
  it('rejects a wrong checksum digit', () => {
    expect(validateNationalId('A123456788')).not.toBeNull();
  });
  it('rejects malformed shapes', () => {
    expect(validateNationalId('123456789')).not.toBeNull(); // no leading letter
    expect(validateNationalId('A323456789')).not.toBeNull(); // gender digit not 1/2
    expect(validateNationalId('AB23456789')).not.toBeNull(); // two letters
    expect(validateNationalId('')).not.toBeNull();
  });
});

describe('validateBusinessId (TW 統一編號 checksum)', () => {
  it('accepts real 統一編號 that pass the standard %10 checksum branch', () => {
    // Real published business IDs — both satisfy total % 10 === 0.
    expect(validateBusinessId('22099131')).toBeNull(); // 台積電 TSMC
    expect(validateBusinessId('04595257')).toBeNull(); // valid via standard branch
    // surrounding whitespace is trimmed before validation
    expect(validateBusinessId('  22099131  ')).toBeNull();
  });

  it('rejects a checksum-invalid id (load-bearing vs format-only)', () => {
    // 8 digits so it passes the /^\d{8}$/ format gate, but the weighted-digit
    // total (42) fails BOTH the %10 and the (total+1)%10 special branch.
    // A format-only validateBusinessId would (wrongly) return null here.
    expect(validateBusinessId('12345678')).toBe('統一編號檢查碼錯誤。');
  });

  it('rejects format-invalid input with the format error message', () => {
    expect(validateBusinessId('1234567')).toBe('統一編號需為 8 位數字。');   // 7 digits
    expect(validateBusinessId('123456789')).toBe('統一編號需為 8 位數字。'); // 9 digits
    expect(validateBusinessId('1234567a')).toBe('統一編號需為 8 位數字。'); // non-digit char
    expect(validateBusinessId('')).toBe('請輸入統一編號。');                  // empty
  });

  it('accepts the 7th-digit-is-7 special case (valid only via (total+1)%10)', () => {
    // 00000177: weighted-digit total is 19 → 19 % 10 !== 0 (fails standard
    // branch), but the 7th digit is 7 and (19 + 1) % 10 === 0, so it is valid
    // ONLY through the special branch. A validator missing that branch would
    // reject this, so this assertion pins the special-case code path.
    expect(validateBusinessId('00000177')).toBeNull();
  });
});

describe('validateCompanyName', () => {
  it('accepts a normal company name', () => {
    expect(validateCompanyName('CoverOnes 股份有限公司')).toBeNull();
  });
  it('rejects empty', () => {
    expect(validateCompanyName('  ')).not.toBeNull();
  });
  it('rejects > 100 chars', () => {
    expect(validateCompanyName('x'.repeat(101))).not.toBeNull();
  });
});

describe('validatePassword', () => {
  it('accepts a 12+ char password', () => {
    expect(validatePassword('correcthorse')).toBeNull();
  });
  it('rejects < 12 chars', () => {
    expect(validatePassword('short')).not.toBeNull();
  });
  it('rejects > 128 chars', () => {
    expect(validatePassword('a'.repeat(129))).not.toBeNull();
  });
});
