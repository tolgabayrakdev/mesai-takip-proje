import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import errorHandler from './middleware/errorHandler.js';

import { config } from "./config/environment.js"
import authRoutes from './routes/auth.routes.js';
import shiftRoutes from './routes/shift.routes.js';
import adminRoutes from './routes/admin.routes.js';

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
app.use('/api/auth', authRoutes);
app.use('/api/shift', shiftRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);


export default app;