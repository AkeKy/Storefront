export type SessionUser = {
  memberId: number;
  username: string;
  firstName: string;
  permissionId: 1 | 2;
  permissionName: string;
  profileImage?: string;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegistrationData = {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  birth_date: string;
};

export type AuthActionError =
  'invalidCredentials' | 'accountConflict' | 'invalidRequest' | 'unavailable';

export type AuthActionResult = { ok: true } | { ok: false; error: AuthActionError };

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';
