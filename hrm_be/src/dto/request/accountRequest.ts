// types/account.ts
export interface AccountRequest {
  username: string;
  password: string;
  roleId: number;
}

// Factory function để tạo AccountRequest
export const createAccountRequest = ({
  username,
  password,
  roleId,
}: AccountRequest): AccountRequest => ({
  username,
  password,
  roleId,
});
