import sequelize from "sequelize";

export function defineMailbox(instance) {
    const Mailbox = instance.define('mailbox', {
        id: {
            type: sequelize.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        mailbox: {
            type: sequelize.STRING,
            allowNull: false
        },
        userid: {
            type: sequelize.STRING,
            allowNull: false
        },
        key: {
            type: sequelize.STRING,
            allowNull: false
        }
    })

    Mailbox.findByName = async (name) => {
        const mailbox = await Mailbox.findOne({
            where: {
                mailbox: name
            }
        })
        return mailbox ? mailbox.dataValues : {userid: null}
    } 

    Mailbox.list = async (userid) => {
        const mailbox = await Mailbox.findAll({
            where: {
                userid
            }
        })
        return mailbox ? mailbox.map(b => b.dataValues) : null
    }

    return Mailbox
}
