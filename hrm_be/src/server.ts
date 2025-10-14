import dotenv from "dotenv";
dotenv.config(); // luôn đầu file

import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 8080; // dùng PORT do Cloud Run cấp, fallback 8080

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

