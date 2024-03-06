/**
 * Go through server member list, register koirameili for them and send a dm 
 */
import dotenv from "dotenv"
await dotenv.config()
 
import { getUserData } from "../src/api/api.js"
import discord, { registerMailboxForMember } from "../src/discord/discord.js"
import database from "../src/db/database.js"

await discord.client.login(process.env.DISCORDTOKEN)
await database.connect()
const userData = await getUserData()

const unregisteredMembers = userData.filter(user => !user.registered)

const mockMember = {
    id: "639844207439118346",
    username: "mikael",
    registered: false,
    newUsername: "mikael"
}

let i = 0
for await (let member of unregisteredMembers) {
    if (!process.env.WET) {
        member = mockMember
    }
    // wet run is opposite of dry run
    i++
    console.log(`${i} / ${unregisteredMembers.length}`)

    registerMailboxForMember(member.id, member.username, member.newUsername)

    // delay can be adjusted. 30 seconds is fine because we are not in a hurry.
    await new Promise(resolve => setTimeout(resolve, 30000));

    if (!process.env.WET) {
        break
    }
}   
