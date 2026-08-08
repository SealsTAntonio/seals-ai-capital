export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Enter your password.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
}
