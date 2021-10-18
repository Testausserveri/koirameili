import sequelize from "sequelize";

export function defineBlock(instance) {
    const Block = instance.define('Block', {
        id: {
            type: sequelize.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        from: {
            type: sequelize.STRING,
            allowNull: false
        },
        to: {
            type: sequelize.STRING,
            allowNull: false
        },
        userid: {
            type: sequelize.STRING,
            allowNull: false
        }
    })
    
    Block.exists = async (from, to) => {
        const block = await Block.findOne({
            where: {
                from,
                to
            }
        })
        return !!block 
    }

    Block.list = async (userid) => {
        const block = await Block.findAll({
            where: {
                userid
            }
        })
        return block ? block.map(b => b.dataValues) : null
    }

    Block.delete = (userid, id) => {
        return Block.destroy({
            where: {
                id,
                userid
            }
        });
    }

    return Block
}
