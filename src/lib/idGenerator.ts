export const generateId = () => {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : (typeof window !== 'undefined' ? window.crypto : undefined);
  if (cryptoObj) {
    if (cryptoObj.randomUUID) return cryptoObj.randomUUID();
    if (cryptoObj.getRandomValues) {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
        (Number(c) ^ cryptoObj.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
      );
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
};
