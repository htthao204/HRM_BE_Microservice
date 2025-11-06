import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

// Kiểm tra biến môi trường
if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST) {
  throw new Error("❌ Thiếu biến môi trường cấu hình database (.env)");
}

// Khởi tạo Sequelize với PostgreSQL
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT) || 5432,
  dialect: "postgres",
  logging: false, // tắt log SQL, có thể bật nếu cần debug
  dialectOptions: {
    ssl: false, // Nếu bạn dùng cloud DB (Heroku/AWS RDS) có thể cần true
  },
  define: {
    freezeTableName: true, // không tự động thêm 's' vào tên bảng
    underscored: true, // tự động dùng snake_case cho cột
  },
});

// Hàm kết nối Database
export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected successfully");
  } catch (error) {
    console.error("❌ Unable to connect to PostgreSQL:", error);
    process.exit(1); // dừng app nếu không kết nối được
  }
};

export default sequelize;
