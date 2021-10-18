import { chunkString, formatAddress } from "../utils.js"
import { client } from "./discord.js"

const blockButton = (from, to) => ({
    "components": [
        {
            "type": 1,
            "components": [
                {
                    "type": 2,
                    "label": "Estä lähettäjä tähän osoitteeseen",
                    "style": 2,
                    "custom_id": "block=" + btoa(from) + "," + btoa(to)
                }
            ]
        }
    ]
})

export async function deliverMail(userid, message) {
    const user = await client.users.fetch(userid)
    const color = Math.floor(Math.random()*16777215);

    function sendEmbed(title, description, last) {
        return user.send({
            embeds: [{
                color, title, description
            }],
            ...(last ? blockButton(message.from[0].address, message.mailbox.toString()) : null)
        })
    }

    const title = `Lähettäjä: ${formatAddress(message.from)}\nSaaja: ${formatAddress(message.to)}\n\n${message.subject}`;

    if (message.text.toString().length < 1500) {
        sendEmbed(
            title,
            message.text,
            true
        )
    } else {
        const messageChunks = chunkString(message.text.toString(), 1950)
        await sendEmbed(title)

        for (const index in messageChunks) {
            const messageChunk = messageChunks[index]
            const last = index == messageChunks.length - 1
            await sendEmbed(null, messageChunk, last)
        }
    }
}