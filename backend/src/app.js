import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import { config } from "./config/enviroment.js"

const app = express();

// Middleware
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Routes
app.get('/', (req, res) => {
  res.send('Hello, World!');
});


export default app;