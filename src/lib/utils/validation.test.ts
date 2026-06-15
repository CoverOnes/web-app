/**
 * Tests for src/lib/utils/validation.ts
 *
 * Covers validateRoomId UUID fix (Finding 2) — backend uses gen_random_uuid() (36-char UUID),
 * not MongoDB ObjectID (24-char hex). Every real room id from the backend is a UUID.
 */
import { describe, it, expect } from 'vitest';
import { validateRoomId, validateMessage, validateRoomName, validateUserId } from './validation';

// ── validateRoomId ────────────────────────────────────────────────────────────

describe('validateRoomId — UUID format (backend gen_random_uuid)', () => {
  it('accepts a well-formed lowercase UUID', () => {
    expect(() => validateRoomId('f9d9438f-f0b3-4e24-ab4e-e49296d32a82')).not.toThrow();
  });

  it('accepts a well-formed uppercase UUID', () => {
    expect(() => validateRoomId('F9D9438F-F0B3-4E24-AB4E-E49296D32A82')).not.toThrow();
  });

  it('accepts a mixed-case UUID', () => {
    expect(() => validateRoomId('A1B2C3D4-e5f6-7890-abcd-EF1234567890')).not.toThrow();
  });

  it('rejects a 24-char MongoDB ObjectID (old incorrect assumption)', () => {
    // This was incorrectly accepted before the fix and now must be rejected
    expect(() => validateRoomId('507f1f77bcf86cd799439011')).toThrow('聊天室 ID 格式錯誤');
  });

  it('rejects empty string', () => {
    expect(() => validateRoomId('')).toThrow('聊天室 ID 不能為空');
  });

  it('rejects whitespace-only string', () => {
    expect(() => validateRoomId('   ')).toThrow('聊天室 ID 不能為空');
  });

  it('rejects UUID without hyphens', () => {
    expect(() => validateRoomId('f9d9438ff0b34e24ab4ee49296d32a82')).toThrow('聊天室 ID 格式錯誤');
  });

  it('rejects malformed string with wrong group lengths', () => {
    expect(() => validateRoomId('f9d9438f-f0b3-4e24-ab4e-e49296d32a')).toThrow('聊天室 ID 格式錯誤');
  });

  it('rejects string with non-hex characters', () => {
    expect(() => validateRoomId('g9d9438f-f0b3-4e24-ab4e-e49296d32a82')).toThrow('聊天室 ID 格式錯誤');
  });
});

// ── validateMessage ───────────────────────────────────────────────────────────

describe('validateMessage', () => {
  it('accepts a normal message', () => {
    expect(() => validateMessage('Hello world')).not.toThrow();
  });

  it('rejects empty string', () => {
    expect(() => validateMessage('')).toThrow('訊息不能為空');
  });

  it('rejects whitespace-only', () => {
    expect(() => validateMessage('   ')).toThrow('訊息不能為空');
  });

  it('rejects message exceeding 10000 chars', () => {
    expect(() => validateMessage('a'.repeat(10001))).toThrow('訊息長度超過限制');
  });

  it('rejects message with null byte', () => {
    const withNullByte = 'hello' + String.fromCharCode(0) + 'world';
    expect(() => validateMessage(withNullByte)).toThrow('訊息包含非法字符');
  });
});

// ── validateRoomName ──────────────────────────────────────────────────────────

describe('validateRoomName', () => {
  it('accepts a normal room name', () => {
    expect(() => validateRoomName('QA Test Room')).not.toThrow();
  });

  it('rejects empty string', () => {
    expect(() => validateRoomName('')).toThrow('聊天室名稱不能為空');
  });

  it('rejects name > 100 chars', () => {
    expect(() => validateRoomName('a'.repeat(101))).toThrow('聊天室名稱超過限制');
  });
});

// ── validateUserId ────────────────────────────────────────────────────────────

describe('validateUserId', () => {
  it('accepts a UUID-format user id', () => {
    expect(() => validateUserId('f9d9438f-f0b3-4e24-ab4e-e49296d32a82')).not.toThrow();
  });

  it('rejects empty string', () => {
    expect(() => validateUserId('')).toThrow('用戶 ID 不能為空');
  });

  it('rejects id containing special chars', () => {
    expect(() => validateUserId('user${exploit}')).toThrow('用戶 ID 包含非法字符');
  });
});
