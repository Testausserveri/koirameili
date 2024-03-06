import { Router } from "express"
import crypto from "crypto"
import cacheService from "express-api-cache"

import database from "../db/database.js"
import { client as discord } from "../discord/discord.js"
import { cleanUpload, upload } from "./upload.js"

const { cache } = cacheService

export const apiRoute = Router()

export const welcomeMessage = (mailbox) => (`Testausserveri myöntää jäsenilleen ilmaisen sähköpostiosoitteen jäsenetuna!

Ole hyvä, tässä on sinun: **${mailbox}@koira.testausserveri.fi**

Muutamia seikkoja tästä jäsenedusta:
- täysin ilmainen, meillä ei ole tähän mitään maksullisuutta
- rajattomasti tilaa
- ainoastaan sähköpostiviestien vastaanottaminen
- sähköpostit tulevat suoraan Discordiin, tähän yksityiseen keskusteluun, joka toimii sinun postilaatikkonasi!

Voit käyttää uutta sähköpostiosoitettasi esimerkiksi turhiin nettipalveluihin rekisteröitymiseen tai uutiskirjeiden tilaamiseen. ... tai flexaamiseen :wink: Lisätietoja servullamme!

PS: Jos haluat **omanimi@testausserveri.fi**, sähköpostiviestien lähettämisen, pääsyn Gmailiin, niin sen kaiken saa liittymällä Testausserveri ryn jäseneksi! Linkki yhdistyksen jäsenhakemuslomakkeeseen <#798799175072219136> kanavalla.
`)

apiRoute.post("/register", upload.single('image'), async (req, res) => {
    res.on("finish", async () => {
        await cleanUpload(req.file.path)
    })

    try {
        const mailbox = req.body.mailbox
        const userid = req.body.id
        const filename = req.file.path

        console.log(mailbox, userid, filename)
        const taken = (await database.models.mailbox.findByName(mailbox)).userid || false

        if (taken) return res.json({status: "error", message: "Sähköpostilaatikko on varattu"})
        if (!mailbox || !userid || !filename) return res.status(400).json({status: "error", message: "Ei riittävästi syötettä"})

        await database.models.mailbox.create({
            mailbox, userid, key: await crypto.randomBytes(20).toString('hex')
        })

        const user = await discord.users.fetch(userid)
        await user.send({files: [filename]})
        await user.send(welcomeMessage(mailbox))

        res.json({status: "ok"})
    } catch (e) {
        res.status(500).json({status: "error", message: e.message})
    }
})

apiRoute.get("/users", cache("20 seconds"), async (req, res) => {
    const userData = await getUserData()
    res.json(userData)
})

apiRoute.get("/checkAvailability", async (req, res) => {
    if (!req.query.mailbox || req.query.mailbox.length <= 1) return res.status(400).json({available: null})
    const available = (await database.models.mailbox.findByName(req.query.mailbox)).userid || false
    res.json({available})
})

export const getUserData = async () => {
    const mailboxes = await database.models.mailbox.listAll()
    const guild = await discord.guilds.fetch(process.env.DISCORDDEFAULTGUILD)
    const guildMembers = await guild.members.fetch()
    const members = [...guildMembers].map(([i, member]) => ({
        id: member.id,
        username: member.user.tag,
        registered: mailboxes.find(mailbox => mailbox.userid == member.id)?.mailbox || false,
        joinedTimestamp: member.joinedTimestamp,
        createdAt: member.user.createdAt,
        // property added after new Discord's API
        newUsername: member.user.discriminator == "0" ? member.user.username : null
    }))
    members.sort((a, b) => b.joinedTimestamp - a.joinedTimestamp)

    console.log(`User data updated. Loaded ${members.length} members, out of which ${members.reduce((p, c) => (p + (c.registered ? 1 : 0)), 0)} (${mailboxes.length}) are registered.`)

    return members
}

