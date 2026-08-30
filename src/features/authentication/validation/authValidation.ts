export type PasswordRequirements = {
  minimumLength: boolean;
  uppercase: boolean;
  numberOrSymbol: boolean;
};

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function getPasswordRequirements(value: string): PasswordRequirements {
  return {
    minimumLength: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    numberOrSymbol: /[\d\W_]/.test(value),
  };
}

export function isStrongPassword(value: string): boolean {
  return Object.values(getPasswordRequirements(value)).every(Boolean);
}

export type CreateAccountValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export type CreateAccountErrors = Partial<Record<keyof CreateAccountValues, string>>;

export function validateCreateAccount(values: CreateAccountValues): CreateAccountErrors {
  const errors: CreateAccountErrors = {};
  if (values.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
  if (!isValidEmail(values.email)) errors.email = 'Enter a valid email address.';
  if (!isStrongPassword(values.password)) {
    errors.password = 'Use 8+ characters with an uppercase letter and a number or symbol.';
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords must match.';
  }
  if (!values.acceptedTerms) errors.acceptedTerms = 'Accept the Terms and Privacy Policy.';
  return errors;
}

export function validateSignIn(email: string, password: string) {
  return {
    email: isValidEmail(email) ? undefined : 'Enter a valid email address.',
    password: password ? undefined : 'Enter your password.',
  };
}
