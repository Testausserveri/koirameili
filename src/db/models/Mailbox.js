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

    return Mailbox
}
