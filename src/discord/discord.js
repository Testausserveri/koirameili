import { Client } from "discord.js"
import database from "../db/database.js"
import { deliverMail } from "./delivery.js"

export const client = new Client({ intents: [] })

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

function handleButtonInteraction(interaction) {
    const {customId, user} = interaction

    if (customId.split("=")[0] == "block") { 
        const [from, to] = customId.split("=")[1].split(",").map(value => atob(value))
        
        console.log("Creating a new block", user.id, from, to)

        database.models.block.create({
            from,
            to,
            userid: user.id
        })

        interaction.reply(`Lähettäjä **${from}** on jatkossa estetty lähettämästä osoitteeseen **${to}@${process.env.MAILDOMAIN}**.`)
    } else {
        interaction.reply("Huutista :D Mulla ei ole kyllä nyt harmainta hajuakaan mitä on tapahtunut :DD Mut tiiän ainaki sen et toi nappula on RIKKI.")
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
                                "description": `→ ${block.to}@${process.env.MAILDOMAIN}`,
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
    }
}

async function handleMessageComponentInteraction(interaction) {
    if (interaction.customId == "blockdelete") {
        const blocks = (await database.models.block.list(interaction.user.id))

        for (const blockid of interaction.values) {
            await database.models.block.delete(interaction.user.id, parseInt(blockid))
        }

        interaction.reply(`Poistettu seuraavat estot: \n\n` + interaction.values.map(blockid => {
            const block = blocks.find(b => b.id == blockid)
            return `• ${block.from} → ${block.to}@${process.env.MAILDOMAIN}`
        }).join("\n"))
    } else {
        interaction.reply("Nyt jokin meni pieleen.")
    }
}

client.on('interactionCreate', interaction => {
    if (interaction.isCommand()) return handleCommandInteraction(interaction)
    if (interaction.isButton()) return handleButtonInteraction(interaction)
    if (interaction.isMessageComponent()) return handleMessageComponentInteraction(interaction)
})

export default {client, deliverMail}