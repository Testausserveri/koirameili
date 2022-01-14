import dotenv from "dotenv"
await dotenv.config()

import express from "express"
import { apiRoute } from "./api.js"

import database from "./db/database.js"
import discord from "./discord/discord.js"
import { smtpServer } from "./mail.js"

await discord.client.login(process.env.DISCORDTOKEN)
await database.connect()

const httpServer = express()
const mailServer = smtpServer();

httpServer.use("/api/", apiRoute)
  
mailServer.listen(25, "0.0.0.0")
httpServer.listen(4000)
