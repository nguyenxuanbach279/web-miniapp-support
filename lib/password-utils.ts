import { PasswordStrength } from './types';

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let score = 0;
  if (minLength) score += 1;
  if (hasUpper && hasLower) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;
  if (password.length >= 12) score += 1;

  return {
    score,
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };
}

export function isPasswordStrong(password: string): boolean {
  const evalResult = evaluatePasswordStrength(password);
  return (
    evalResult.minLength &&
    evalResult.hasUpper &&
    evalResult.hasLower &&
    evalResult.hasNumber &&
    evalResult.hasSpecial
  );
}
