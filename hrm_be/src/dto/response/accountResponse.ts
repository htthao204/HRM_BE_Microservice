export const AccountResponse = (
  account: any
): {
  id: number;
  username: string;
  createdAt: Date;
  updatedAt: Date;
} => {
  return {
    id: account.id,
    username: account.username,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
};
