const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates password against common Cognito password policy requirements.
 * Returns an array of unmet requirement labels (empty = valid).
 */
export function getPasswordPolicyErrors(password) {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[0-9]/.test(password)) errors.push("One number");
  if (!/[^a-zA-Z0-9]/.test(password)) errors.push("One special character");
  return errors;
}

export function isPasswordValid(password) {
  return getPasswordPolicyErrors(password).length === 0;
}
