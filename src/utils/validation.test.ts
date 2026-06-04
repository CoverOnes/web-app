import { describe, it, expect } from 'vitest';
import {
  validateLegalName,
  validateNationalId,
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
