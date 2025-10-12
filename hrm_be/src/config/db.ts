// import { Sequelize } from "sequelize"; //Object Relational Mapping thao tac voi csdl bang object va model thay vi viet sql truc tiep
// import dotenv from "dotenv";

// dotenv.config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT,
//     port: process.env.DB_PORT || 3306,
//     logging: false,
//   }
// );

// // Hàm connectDB
// export const connectDB = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("Database connected successfully");
//   } catch (error) {
//     console.error("Unable to connect to the database:", error);
//   }
// };

// export default sequelize;
import { Sequelize } from "sequelize"; // ORM thao tác với CSDL qua model thay vì SQL trực tiếp
import dotenv from "dotenv";

dotenv.config();

// Lấy các biến môi trường
const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT, DB_PORT } =
  process.env;

// Kiểm tra biến môi trường
if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST || !DB_DIALECT) {
  throw new Error("❌ Thiếu biến môi trường cấu hình database (.env)");
}

// Khởi tạo Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT as any, // ép kiểu vì dialect chỉ chấp nhận các giá trị cố định
  port: Number(DB_PORT) || 3306, // convert sang number
  logging: false,
});

// Hàm kết nối Database
export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
};

export default sequelize;
