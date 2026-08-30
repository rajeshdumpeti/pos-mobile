import {
  getPasswordRequirements,
  isStrongPassword,
  isValidEmail,
  validateCreateAccount,
} from './authValidation';

test('validates email addresses without accepting incomplete values', () => {
  expect(isValidEmail('person@example.com')).toBe(true);
  expect(isValidEmail('person@')).toBe(false);
});

test('reports practical password requirements independently', () => {
  expect(getPasswordRequirements('short')).toEqual({
    minimumLength: false,
    uppercase: false,
    numberOrSymbol: false,
  });
  expect(isStrongPassword('CalmDay1')).toBe(true);
});

test('returns understandable create-account errors', () => {
  expect(
    validateCreateAccount({
      fullName: '',
      email: 'invalid',
      password: 'weak',
      confirmPassword: 'different',
      acceptedTerms: false,
    }),
  ).toEqual({
    fullName: 'Enter your full name.',
    email: 'Enter a valid email address.',
    password: 'Use 8+ characters with an uppercase letter and a number or symbol.',
    confirmPassword: 'Passwords must match.',
    acceptedTerms: 'Accept the Terms and Privacy Policy.',
  });
});
