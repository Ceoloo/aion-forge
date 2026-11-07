export class ForgeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ForgeError';
    this.code = code;
  }
}
export function deny(code, message) { throw new ForgeError(code, message); }
