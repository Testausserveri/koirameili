/**
 * Register slash commands against the Discord API
 */
import dotenv from "dotenv"
await dotenv.config()
 
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'

const commands = [
    {
        name: 'unblock',
        description: 'Näyttää valikon, josta voi poistaa valitsemansa eston'
    },
    {
        name: 'mailboxes',
        description: 'Listaa sähköpostiosoitteesi'
    }
];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORDTOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.DISCORDCLIENTID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
