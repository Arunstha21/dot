import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { startDiscordClient } from "./src/discord/index";

const port = parseInt(process.env.PORT || "3002", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

import "dotenv/config";
import { dbConnect } from "@/lib/db";

const token = process.env.DISCORD_TOKEN;

app.prepare().then(async () => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port);
  if(!token) {
    throw new Error("DISCORD_TOKEN is not defined in the environment variables.");
  }
  dbConnect()
    .then(() => console.log("Database connected successfully."))
    .catch((err) => console.error("Database connection error:", err));

  await startDiscordClient(token);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`,
  );
});
