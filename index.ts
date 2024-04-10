import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { lucia } from "./lib/auth.js";

import accounts from './routes/accounts.js';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use('/', accounts);

app.get("/", async (req: Request, res: Response) => {
  const session = await lucia.createSession("817e9979-09b9-4691-96a1-12b2362a501c", {});
  console.log(session);
  // const result = await pool.query('SELECT * from human;')
  res.send(session);
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});