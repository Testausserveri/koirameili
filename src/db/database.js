import { Sequelize } from "sequelize"
import { defineBlock } from "./models/Block.js";
import { defineMailbox } from "./models/Mailbox.js"

let sequelize, models = {}

function create(db, user, pass, host) {
    sequelize = new Sequelize(db, user, pass, {
        host: host,
        dialect: 'mariadb',
        charset: 'utf8',
        collate: 'utf8_unicode_ci',
        logging: false
    })

    models = {
        mailbox: defineMailbox(sequelize),
        block: defineBlock(sequelize)
    }
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

const database = {connect, create, models}
export default database