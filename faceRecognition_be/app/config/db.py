import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const { DB_NAME, DB_USER, DB_PASSWORD, DB_SOCKET_PATH } = process.env;

export const sequelize = new Sequelize(DB_NAME!, DB_USER!, DB_PASSWORD!, {
  dialect: "mysql",
  dialectOptions: {
    socketPath: DB_SOCKET_PATH, // Dùng đường dẫn socket đã khai báo
  },
  logging: false,
});

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
};
