import { Client, Intents } from "discord.js"
import database from "../db/database.js"
import { deliverMail } from "./delivery.js"

import fs from "fs/promises"
import path from "path"
import crypto from "crypto"
import convertSvgToPng from "convert-svg-to-png"
import { welcomeMessage } from "../api/api.js"
const { createConverter } = convertSvgToPng

const welcomeHeaderSvg = await fs.readFile(path.join(import.meta.dirname, "../../frontend/src/welcomeHeader.svg"), 'utf-8')

const converter = createConverter()

export const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] })

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

export async function registerMailboxForMember(userid, tag, newUsername) {
    try {
        console.log(`Registering mailbox for: ${tag} (${userid})`)

        if (!newUsername) {
            console.log("Old username format")
            return
        }

        const mailbox = await database.models.mailbox.getAvailableMailbox(newUsername)
        console.log("Mailbox: " + mailbox)
    
        await database.models.mailbox.create({
            mailbox, userid, key: await crypto.randomBytes(20).toString('hex')
        })
        
        const renderedWelcomeHeader = await converter.convert(welcomeHeaderSvg.replace('[name]', mailbox))
    
        const user = await client.users.fetch(userid)
        await user.send({files: [renderedWelcomeHeader]})
        await user.send(welcomeMessage(mailbox))
    } catch (e) {
        console.log(e.message)
    }
}

client.on('guildMemberAdd', async (member) => {
    const mailbox = await database.models.mailbox.findOne({
        where: {
            userid: member.user.id
        }
    })
    if (mailbox) {
        console.log(`Member ${member.user.tag} joined the guild but already has a mailbox registered`)
        return
    }
    const newUsername = member.user.discriminator == "0" ? member.user.username : null
    console.log(`Scheduling mailbox registration for member ${member.user.tag}`)
    setTimeout(() => {
        registerMailboxForMember(member.user.id, member.user.tag, newUsername)
    }, 1000 * 60 * 10);
})

function handleButtonInteraction(interaction) {
    const {customId, user} = interaction

    if (customId.split("=")[0] == "block") { 
        const [from, to] = customId.substring(6).split(",").map(value => atob(value))
        
        console.log("Creating a new block", user.id, from, to)

        database.models.block.create({
            from,
            to: to,
            userid: user.id
        })

        interaction.reply(`Lähettäjä **${from}** on jatkossa estetty lähettämästä osoitteeseen **${to}**. Estoja voi purkaa komennolla **/unblock**.`)
    }
}

async function handleCommandInteraction(interaction) {
    // See scripts/register.js for registering slash commands

    // to-do check that unblock list is requested in dm
    if (interaction.commandName === 'unblock') {
        const blocks = await database.models.block.list(interaction.user.id)
        if (blocks.length == 0) {
            await interaction.reply("Sinulla ei ole yhtään estoa.")
            return
        }
        
        const response = {
            "content": "Valitse poistettavat estot:",
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 3,
                            "custom_id": "blockdelete",
                            "options": blocks.map(block => ({
                                "label": `${block.from}`,
                                "description": `→ ${block.to}`,
                                "value": block.id.toString()
                            })),
                            "placeholder": "Valitse esto",
                            "min_values": 1,
                            "max_values": Math.min(50, blocks.length)
                        }
                    ]
                }
            ]
        };
        
        await interaction.reply(response);
    } else if (interaction.commandName == "mailboxes") {
        const mailboxes = await database.models.mailbox.list(interaction.user.id)
        await interaction.reply({content: `Pystyt vastaanottamaan sähköpostia seuraavista osoitteista:\n\n` + 
        mailboxes.flatMap(mailbox => 
            process.env.MAILDOMAIN.split(",").map(maildomain => 
                (`• ${mailbox.mailbox}@${maildomain}`)
            )).join("\n"), ephemeral: true})
    }
}

async function handleMessageComponentInteraction(interaction) {
    if (interaction.customId == "blockdelete") {
        console.log("Removing blocks", interaction.user.id, interaction.values)
        const blocks = (await database.models.block.list(interaction.user.id))

        for (const blockid of interaction.values) {
            await database.models.block.delete(interaction.user.id, parseInt(blockid))
        }

        interaction.reply(`Poistettu seuraavat estot: \n\n` + interaction.values.map(blockid => {
            const block = blocks.find(b => b.id == blockid)
            return `• ${block.from} → ${block.to}`
        }).join("\n"))
     // testauskoira-rs freedom starts here
    }/* else {
        interaction.reply("Nyt jokin meni pieleen.")
    }*/
}

client.on('interactionCreate', interaction => {
    if (interaction.isCommand()) return handleCommandInteraction(interaction)
    if (interaction.isButton()) return handleButtonInteraction(interaction)
    if (interaction.isMessageComponent()) return handleMessageComponentInteraction(interaction)
})

export default {client, deliverMail}
