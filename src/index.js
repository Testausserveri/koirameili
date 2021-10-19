import dotenv from "dotenv"
await dotenv.config()

import { SMTPServer } from "smtp-server"
import { simpleParser as parser } from "mailparser"

import database from "./db/database.js"
import discord from "./discord/discord.js"
import { emailAddressToMailboxName, formatAddress } from "./utils.js"

await discord.client.login(process.env.DISCORDTOKEN)
await database.connect()

const server = new SMTPServer({
    onData(stream, session, callback) {
        parser(stream, {}, (err, parsed) => {
                if (err) {
                    console.log("Error:" , err)
                    return
                }
                
                onMessage(parsed)
                //stream.on("end", callback)
        })

        return callback();
    },
    disabledCommands: ['AUTH']
});
  
server.listen(25, "0.0.0.0")

async function onMessage(data) {
    try {
        console.log(`Mail received from ${formatAddress(data.from.value)} -> to ${formatAddress(data.to.value)}`)
        const from = data.from.value[0].address
        for (const recipient of data.to.value) {
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
                from: data.from.value,
                to: data.to.value,
                mailbox: mailbox,
                subject: data.subject,
                text: data.text
            })
        }
    } catch (e) {
        console.log(`Couldn't deliver mail. ${e.message}`)
    }
}
