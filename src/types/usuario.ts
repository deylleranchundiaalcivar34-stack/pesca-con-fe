// Resumen de usuario que comparten header, cuenta y layout publico.
export type PublicUserSummary = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  cedula?: string;
  phone?: string;
  isAdmin?: boolean;
};
