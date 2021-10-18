import dotenv from "dotenv"
await dotenv.config()

import mailin from "mailin"
import database from "./db/database.js"
import discord from "./discord/discord.js"
import { emailAddressToMailboxName, formatAddress } from "./utils.js"

await discord.client.login(process.env.DISCORDTOKEN)
await database.connect()

mailin.start({
    port: 25,
    disableWebhook: true,
    logLevel: "warn"
})

mailin.on('message', async (_, data) => {
    try {
        console.log(`Mail received from ${formatAddress(data.from)} -> to ${formatAddress(data.to)}`)
        const from = data.from[0].address

        for (const recipient of data.to) {
            // Resolve mailbox and corresponding Discord recipient
            const mailbox = emailAddressToMailboxName(recipient.address)
            const {userid} = await database.models.mailbox.findByName(mailbox.name)
            if (!userid) throw new Error(`Mailbox ${mailbox.name} isn't claimed`)

            // Abort if from-to pair has been blocked
            if (await database.models.block.exists(from, mailbox.toString())) {
                console.log(`Aborting delivery, block exists ${from} -> ${recipient.address}`)

                return
            }

            // Deliver received email to Discord
            discord.deliverMail(userid, {
                from: data.from,
                to: data.to,
                mailbox: mailbox,
                subject: data.subject,
                text: data.text
            })
        }
    } catch (e) {
        console.log(`Couldn't deliver mail. ${e.message}`)
    }
})