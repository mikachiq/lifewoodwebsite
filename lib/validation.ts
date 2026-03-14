export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function passwordMeetsRules(password: string) {
  const lengthOk = password.length >= 8;
  const uppercaseOk = /[A-Z]/.test(password);
  const numberOk = /[0-9]/.test(password);
  return lengthOk && uppercaseOk && numberOk;
}

