import dotenv from "dotenv"
await dotenv.config()

import { Sequelize } from "sequelize"
import { defineBlock } from "./models/Block.js";
import { defineMailbox } from "./models/Mailbox.js"

const sequelize = new Sequelize(process.env.MARIADBDB, process.env.MARIADBUSER, process.env.MARIADBPASS, {
    host: process.env.MARIADBHOST,
    dialect: 'mariadb',
    logging: false
})

const models = {
    mailbox: defineMailbox(sequelize),
    block: defineBlock(sequelize)
}

async function connect() {
    try {
        await sequelize.authenticate();
        console.log("Database connection has been established successfully");

        await sequelize.sync();
        console.log("Models synchronized")
    } catch (error) {
        console.error("Unable to connect to the database:", error);
        process.exit(-1);
    }
}

export default {connect, models}