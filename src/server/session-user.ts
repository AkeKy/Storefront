import 'server-only';

export type PublicSessionUser = {
  member_id: number;
  username: string;
  first_name: string;
  permission_id: number;
  permission_name: string;
  profile_image?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizedNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized || undefined;
};

export const parsePublicSessionUser = (value: unknown): PublicSessionUser | undefined => {
  if (!isRecord(value)) return undefined;

  const username = normalizedNonEmptyString(value.username);
  const firstName = normalizedNonEmptyString(value.first_name);
  const permissionName = normalizedNonEmptyString(value.permission_name);
  const memberId = value.member_id;
  const permissionId = value.permission_id;
  if (
    typeof memberId !== 'number' ||
    !Number.isSafeInteger(memberId) ||
    memberId <= 0 ||
    typeof permissionId !== 'number' ||
    !Number.isSafeInteger(permissionId) ||
    permissionId <= 0 ||
    !username ||
    !firstName ||
    !permissionName
  ) {
    return undefined;
  }
  if (value.profile_image !== undefined && typeof value.profile_image !== 'string')
    return undefined;

  const profileImage = normalizedNonEmptyString(value.profile_image);
  return {
    member_id: memberId,
    username,
    first_name: firstName,
    permission_id: permissionId,
    permission_name: permissionName,
    ...(profileImage ? { profile_image: profileImage } : {}),
  };
};
