const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

export const passwordPolicyHint =
  "Usa al menos 8 caracteres, con mayuscula, minuscula, numero y caracter especial.";

// Mantiene la misma regla al registrar una cuenta y al restablecer su contrasena.
export function getPasswordValidationError(password: string) {
  if (!PASSWORD_POLICY.test(password)) {
    return passwordPolicyHint;
  }

  return null;
}
