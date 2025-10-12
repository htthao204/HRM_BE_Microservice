import dotenv from "dotenv";
dotenv.config(); // PHẢI ở đầu file

import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

// Kết nối database trước khi start server
connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
