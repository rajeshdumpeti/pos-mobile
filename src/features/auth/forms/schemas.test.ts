import {
  createAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  verifyEmailSchema,
} from './schemas';

const password = 'fifteen-characters';
test('all auth schemas accept backend-shaped local values', () => {
  expect(
    createAccountSchema.parse({
      displayName: 'A',
      email: 'a@b.co',
      password,
      confirmPassword: password,
    }),
  ).toBeTruthy();
  expect(signInSchema.parse({ email: 'a@b.co', password: 'x' })).toBeTruthy();
  expect(forgotPasswordSchema.parse({ email: 'a@b.co' })).toBeTruthy();
  expect(resetPasswordSchema.parse({ password, confirmPassword: password })).toBeTruthy();
  expect(verifyEmailSchema.parse({ code: '012345' }).code).toBe('012345');
});
test('schemas enforce backend-authorized constraints and confirmation', () => {
  expect(
    createAccountSchema.safeParse({
      displayName: '',
      email: 'bad',
      password: 'short',
      confirmPassword: 'other',
    }).success,
  ).toBe(false);
  expect(
    createAccountSchema.safeParse({
      displayName: 'x'.repeat(161),
      email: 'a@b.co',
      password,
      confirmPassword: password,
    }).success,
  ).toBe(false);
  expect(signInSchema.safeParse({ email: 'a@b.co', password: 'x'.repeat(1025) }).success).toBe(
    false,
  );
  expect(resetPasswordSchema.safeParse({ password, confirmPassword: `${password}!` }).success).toBe(
    false,
  );
  expect(verifyEmailSchema.safeParse({ code: '12345' }).success).toBe(false);
  expect(verifyEmailSchema.safeParse({ code: '１２３４５６' }).success).toBe(false);
});
test('email values are validated without silent normalization', () => {
  const original = 'Person@Example.COM';
  expect(signInSchema.parse({ email: original, password: 'x' }).email).toBe(original);
  expect(signInSchema.safeParse({ email: ' person@example.com ', password: 'x' }).success).toBe(
    false,
  );
});
