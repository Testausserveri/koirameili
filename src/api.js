import { Router } from "express"
import database from "./db/database.js"
import { client as discord } from "./discord/discord.js"

export const apiRoute = Router()

// to-do: add cache
apiRoute.get("/users", async (req, res) => {
    const userData = await getUserData()
    res.json(userData)
})

apiRoute.get("/checkAvailability", async (req, res) => {
    if (!req.query.mailbox || req.query.mailbox.length <= 1) return res.status(400).json({available: null})
    const available = !(await database.models.mailbox.findByName(req.query.mailbox)).userid
    res.json({available})
})

apiRoute.use((req, res) => {
    console.log(req.path)
    res.end("404")
})

const getUserData = async () => {
    const mailboxes = await database.models.mailbox.listAll()
    const guild = await discord.guilds.fetch(process.env.DISCORDDEFAULTGUILD)
    const guildMembers = await guild.members.fetch()
    const members = [...guildMembers].map(([i, member]) => ({
        id: member.id,
        username: member.user.tag,
        registered: mailboxes.find(mailbox => mailbox.userid == member.id)?.mailbox || false,
        joinedTimestamp: member.joinedTimestamp,
        createdAt: member.user.createdAt
    }))
    members.sort((a, b) => b.joinedTimestamp - a.joinedTimestamp)

    console.log(`User data updated. Loaded ${members.length} members, out of which ${members.reduce((p, c) => (p + (c.registered ? 1 : 0)), 0)} (${mailboxes.length}) are registered.`)

    return members
}

