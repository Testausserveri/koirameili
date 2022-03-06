import { Client, Intents } from "discord.js"
import database from "../db/database.js"
import { deliverMail } from "./delivery.js"

export const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] })

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
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
    } else {
        // testauskoira-rs freedom starts here
        //interaction.reply("Nyt jokin meni pieleen.")
    }
}

client.on('interactionCreate', interaction => {
    if (interaction.isCommand()) return handleCommandInteraction(interaction)
    if (interaction.isButton()) return handleButtonInteraction(interaction)
    if (interaction.isMessageComponent()) return handleMessageComponentInteraction(interaction)
})

export default {client, deliverMail}
