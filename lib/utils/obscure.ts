/**
 * Obscurity-only encoding for correct answers.
 * The key and decode logic are in the client bundle; a determined user can recover the answer.
 * Use only to hide the answer from casual inspection (e.g. dev Network tab).
 */

const PREFIX = "x0";
const DEFAULT_KEY = "scav-obscure";

function getKey(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_OBSCURE_KEY) {
    return process.env.NEXT_PUBLIC_OBSCURE_KEY;
  }
  return DEFAULT_KEY;
}

function xorWithKey(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

/**
 * Encode plaintext for storage. Stored value will show in Network tab instead of the real answer.
 */
export function obscureAnswer(plaintext: string): string {
  if (!plaintext) return "";
  const key = getKey();
  const xored = xorWithKey(plaintext, key);
  const encoded = typeof btoa !== "undefined"
    ? btoa(unescape(encodeURIComponent(xored)))
    : Buffer.from(xored, "utf8").toString("base64");
  return PREFIX + encoded;
}

/**
 * Decode stored value back to plaintext.
 * If the stored value doesn't look obscured (no prefix or decode fails), returns it as-is for backward compatibility.
 */
export function revealAnswer(stored: string): string {
  if (!stored) return "";
  if (!stored.startsWith(PREFIX)) return stored;
  try {
    const encoded = stored.slice(PREFIX.length);
    const xored =
      typeof atob !== "undefined"
        ? decodeURIComponent(escape(atob(encoded)))
        : Buffer.from(encoded, "base64").toString("utf8");
    const key = getKey();
    return xorWithKey(xored, key);
  } catch {
    return stored;
  }
}
