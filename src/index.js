import dotenv from "dotenv"
await dotenv.config()

import path from "path"
import express from "express"
import basicAuth from "express-basic-auth"
import { apiRoute } from "./api/api.js"

import database from "./db/database.js"
import discord from "./discord/discord.js"
import { smtpServer } from "./mail.js"

await discord.client.login(process.env.DISCORDTOKEN)
await database.connect()

const httpServer = express()
const mailServer = await smtpServer();

const users = Object.fromEntries(process.env.APIUSERS.split(",").map(line => line.split(":")))
httpServer.use(basicAuth({ users, challenge: true }))
httpServer.use("/api/", apiRoute)
httpServer.use(express.static(path.join(path.resolve(), './frontend/build/')))
  
mailServer.listen(25, "0.0.0.0")
httpServer.listen(4000)
