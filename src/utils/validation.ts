/**
 * 驗證訊息內容
 */
export const validateMessage = (content: string): void => {
  if (!content || content.trim().length === 0) {
    throw new Error('訊息不能為空');
  }

  if (content.length > 10000) {
    throw new Error('訊息長度超過限制 (最多 10000 字符)');
  }

  if (content.includes('\u0000')) {
    throw new Error('訊息包含非法字符');
  }
};

/**
 * 驗證聊天室名稱
 */
export const validateRoomName = (name: string): void => {
  if (!name || name.trim().length === 0) {
    throw new Error('聊天室名稱不能為空');
  }

  if (name.length > 100) {
    throw new Error('聊天室名稱超過限制 (最多 100 字符)');
  }

  if (name.includes('\u0000')) {
    throw new Error('聊天室名稱包含非法字符');
  }
};

/**
 * 驗證用戶 ID
 */
export const validateUserId = (userId: string): void => {
  if (!userId || userId.trim().length === 0) {
    throw new Error('用戶 ID 不能為空');
  }

  if (userId.length > 100) {
    throw new Error('用戶 ID 格式錯誤');
  }

  // eslint-disable-next-line no-control-regex -- intentional: reject null byte and special chars
  if (/[\u0000${}[\]]/.test(userId)) {
    throw new Error('用戶 ID 包含非法字符');
  }
};

// ===== auth Increment 1: register field validation =====
// These mirror the backend rules so the user gets immediate feedback before the
// request is sent (the backend remains the source of truth and re-validates).

/**
 * 驗證真實姓名 / Legal name — required, 1-100 chars (mirrors backend).
 * Returns a zh-TW error string, or null when valid.
 */
export const validateLegalName = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '請輸入真實姓名。';
  if (trimmed.length > 100) return '真實姓名長度不可超過 100 個字。';
  return null;
};

// TW national ID: 1 uppercase letter (A-Z) followed by 9 digits, where the
// leading digit (gender) is 1 or 2, and the whole string passes the official
// checksum. Letters map to two-digit codes (A=10 … Z=33) per the spec.
const TW_ID_LETTER_VALUES: Record<string, number> = {
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18,
  K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27,
  U: 28, V: 29, W: 32, X: 30, Y: 31, Z: 33,
};

/**
 * 驗證身分證字號 — TW national ID format + checksum.
 * Returns a zh-TW error string, or null when valid.
 */
export const validateNationalId = (value: string): string | null => {
  const id = value.trim().toUpperCase();
  if (id.length === 0) return '請輸入身分證字號。';
  if (!/^[A-Z][12]\d{8}$/.test(id)) {
    return '身分證字號格式錯誤（範例：A123456789）。';
  }

  const letterCode = TW_ID_LETTER_VALUES[id[0]];
  // n1..n10: tens digit + units digit of the letter code, then the 9 digits.
  const digits = [
    Math.floor(letterCode / 10),
    letterCode % 10,
    ...id.slice(1).split('').map((c) => Number(c)),
  ];
  // Weights: 1,9,8,7,6,5,4,3,2,1,1 across the 11 positions.
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  if (sum % 10 !== 0) return '身分證字號檢查碼錯誤。';
  return null;
};

/**
 * 驗證公司名稱 — required for COMPANY accounts, 1-100 chars.
 * Returns a zh-TW error string, or null when valid.
 */
export const validateCompanyName = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '請輸入公司名稱。';
  if (trimmed.length > 100) return '公司名稱長度不可超過 100 個字。';
  return null;
};

/**
 * 驗證密碼 — min 12 chars (mirrors backend WEAK_PASSWORD rule).
 * Returns a zh-TW error string, or null when valid.
 */
export const validatePassword = (value: string): string | null => {
  if (value.length < 12) return '密碼至少需 12 個字元。';
  if (value.length > 128) return '密碼長度不可超過 128 個字元。';
  return null;
};

/**
 * 驗證聊天室 ID (MongoDB ObjectID 格式)
 */
export const validateRoomId = (roomId: string): void => {
  if (!roomId || roomId.trim().length === 0) {
    throw new Error('聊天室 ID 不能為空');
  }

  if (roomId.length !== 24) {
    throw new Error('聊天室 ID 格式錯誤');
  }

  if (!/^[0-9a-fA-F]{24}$/.test(roomId)) {
    throw new Error('聊天室 ID 格式錯誤');
  }
};
