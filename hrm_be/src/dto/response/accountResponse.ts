export interface IAccountResponse {
  id: number;
  username: string;
  is_active?: boolean;
  last_login?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  role?: {
    id: number;
    name: string;
    permissions?: { id: number; name: string; code: string }[];
  } | null;
}

export const AccountResponse = (account: any): IAccountResponse => {
  return {
    id: account.id,
    username: account.username,
    is_active: account.is_active,
    last_login: account.last_login,
    created_at: account.created_at,
    updated_at: account.updated_at,
    role: account.role
      ? {
          id: account.role.id,
          name: account.role.name,
          permissions: account.role.permissions?.map((p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code,
          })),
        }
      : null,
  };
};
