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

    Mailbox.getAvailableMailbox = async (username, i = 0) => {
        const mailbox = username.replace(" ", ".") + (i > 0 ? i : "")
        const available = !(await Mailbox.findByName(mailbox)).userid || false
        if (!available) {
            i++
            return Mailbox.getAvailableMailbox(username, i)
        }
        return mailbox
    }

    Mailbox.list = async (userid) => {
        const mailbox = await Mailbox.findAll({
            where: {
                userid
            }
        })
        return mailbox ? mailbox.map(b => b.dataValues) : null
    }

    Mailbox.listAll = async () => {
        const mailbox = await Mailbox.findAll({
            attributes: ["id", "mailbox", "userid"]
        })
        return mailbox ? mailbox.map(b => b.dataValues) : null
    }

    return Mailbox
}
