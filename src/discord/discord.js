import { Client } from "discord.js"
import database from "../db/database.js"
import { deliverMail } from "./delivery.js"

export const client = new Client({ intents: [] })

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('interactionCreate', interaction => {
	if (!interaction.isButton()) return

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
})

export default {client, deliverMail}