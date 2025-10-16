import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const { DB_NAME, DB_USER, DB_PASSWORD, DB_SOCKET_PATH, DB_HOST, DB_PORT } = process.env;

// tạo instance sequelize
export const sequelize = new Sequelize(DB_NAME!, DB_USER!, DB_PASSWORD!, {
  dialect: "mysql",
  host: DB_HOST || "127.0.0.1",
  port: DB_PORT ? Number(DB_PORT) : 3306,
  dialectOptions: DB_SOCKET_PATH ? { socketPath: DB_SOCKET_PATH } : undefined,
  logging: false,
});

// test connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
};
