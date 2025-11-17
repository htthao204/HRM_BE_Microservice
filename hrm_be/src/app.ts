import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { bodyParser } from "./middlewares/bodyParser.js";
import { errorHandler, CustomError } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser);

// Prefix tất cả API
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Node backend is running");
});

// Handle 404
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} Not Found`);
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

export default app;
