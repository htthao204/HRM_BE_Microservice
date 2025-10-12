import type { AccountRequest } from "../../dto/request/accountRequest";
import Account from "../../models/accountModel";
import bcrypt from "bcryptjs";

export const registerAccount = async (accountRequest: AccountRequest) => {
  const { username, password, roleId } = accountRequest;

  // 1. Kiểm tra username đã tồn tại chưa
  const existingAccount = await Account.findOne({ where: { username } });
  if (existingAccount) {
    throw new Error("username already exists");
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Chọn role_id: nếu roleId không được truyền thì mặc định là 1
  const role_id_value = roleId || 1;

  // 4. Tạo Account mới
  const newAccount = await Account.create({
    username,
    password: hashedPassword,
    roleId: role_id_value,
  });

  // 5. Trả về Account
  return newAccount;
};
