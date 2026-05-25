export function isValidEcuadorianCedula(value: string) {
  const cedula = value.replace(/\D/g, "");

  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  const provinceCode = Number(cedula.slice(0, 2));
  const thirdDigit = Number(cedula[2]);

  if (provinceCode < 1 || provinceCode > 24 || thirdDigit > 5) {
    return false;
  }

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const sum = coefficients.reduce((total, coefficient, index) => {
    const product = Number(cedula[index]) * coefficient;
    return total + (product >= 10 ? product - 9 : product);
  }, 0);

  const expectedDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10);

  return expectedDigit === Number(cedula[9]);
}
