import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index";
import { bodyParser } from "./middlewares/bodyParser";
import { errorHandler, CustomError } from "./middlewares/errorHandler";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser);

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use((req, res, next) => {
  const error: CustomError = new Error(`Route ${req.originalUrl} Not Found`);
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);
export default app;
