const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

//from https://blog.pagesd.info/2019/10/29/use-sqlite-node-async-await/
// Hack to look like node-postgres
// (and handle async / await operation)
db.query = function (sql, params) {
    let that = this;
    return new Promise(function (resolve, reject) {
        that.all(sql, params, function (error, rows) {
            if (error)
                reject(error);
            else
                resolve({ rows: rows });
        });
    });
};

//someone used addrole command for a role that isn't auto approved and requires someone with manage roles permission to approve it
export function addRolePending (messageID, interaction) {
    let data = [messageID, interaction.member.id, interaction.options.get('target').user.id, interaction.options.get('role').role.id, interaction.commandName];
    let sql = `INSERT INTO 
                pending_roles (messageID, submitter, target, role, add_remove)
                VALUES(?, ?, ?, ?, ?)`;

    db.run(sql, data, function(err) {
        if (err) {
            console.error(err.message);
        }
    });

}

//a member with manage roles permission reacted to a message, let's see if it's in the pending role requests table
export function checkPendingReactions (reaction, member) {

    if (!member.permissions.has('MANAGE_ROLES')) return;

    let sql = `SELECT * FROM pending_roles WHERE messageID = ${reaction.message.id}`;

    db.get(sql, [], (err, row) => {
        if (err) {
            throw err;
        }
        reaction.message.channel.messages.fetch(reaction.message.id)
            .then(message => {
                let approved = 'rejected';
                const role = message.guild.roles.cache.get(row['role']);
                if (reaction.emoji.name === '✅') {
                    approved = 'approved';
                    message.guild.members.fetch(row['target'])
                        .then(target =>{
                            switch (row['add_remove']) {
                                case 'addrole':
                                    target.roles.add(role)
                                        .then(() => {
                                            resolvePending(message, member, true);
                                        }).catch(console.error)
                                    break;
                                case 'removerole':
                                    target.roles.remove(role)
                                        .then(() => {
                                            resolvePending(message, member, true);
                                        }).catch(console.error)
                                    break;
                                default:
                                    break;
                            }

                        }).catch(console.error)
                }
                if (reaction.emoji.name === '🚫') {
                                   resolvePending(message, member, false);
                }
                message.guild.members.fetch(row['submitter'])
                    .then(submitter => {
                        submitter.send(`Your role request for ${message.guild.members.cache.get(row['target']).displayName} has been ${approved} - ${message.url}`).catch(console.error)
                    })
            })
    });
}

//update embed of pending role requests
function resolvePending (message, member, approved = false) {
    let color = 15141120;
    let footer = (approved ? "Approved" : "Rejected") + ` by ${member.displayName}`;
    if (approved) {
        color = 59136;
    }
    const embed =
        {
            "content": null,
            "embeds": [
                {
                    "title": "Completed Access Request",
                    "description": message.embeds[0].description,
                    "color": color,
                    "footer": {
                        "text": footer
                    }
                }
            ]
        }
    message.edit(embed).catch(console.error)
    message.reactions.removeAll()
        .then(message => {
            db.run("DELETE FROM pending_roles WHERE messageID=(?)", message.id, function (err) {
                if (err) {
                    console.error(err)
                }
            });
        }).catch(console.error)
}

//add newly submitted keystone data to database
export function uploadKeystones (entry) {
    //check timestamp on key entry and only update if newer
    let sql = `SELECT timestamp FROM keystones WHERE character = '${entry.character}'`;

    db.get(sql, [], (err, row) => {
        if (err) {
            throw err;
        }
        let timestamp = (typeof row === 'undefined') ? 0 : row.timestamp;
        if (Math.sign(entry.timestamp - timestamp)) {
            console.log("Updating ", entry.character);
            let sql = `REPLACE INTO 
                    keystones (character, name, class, spec, role, score_all, score_tank, score_healer, score_dps, guild, key_level, dungeon_name, timestamp, uploader)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(sql, Object.values(entry), function (err) {
                if (err) {
                    return console.error(err.message);
                }
            });
        }
    });
}

//get keystone data from database
export async function getKeystones (min = null, max = null, dungeon = null) {
    //base sql query
    let sql = `SELECT * FROM keystones`;
    if (min || max || dungeon ) {
        sql = sql + ` WHERE `;
        if (min) {
            sql = sql + `key_level >= ${min} AND `
        }
        if (max) {
            sql = sql + `key_level <= ${max} AND `
        }
        if (dungeon) {
            sql = sql + `dungeon_name = '${dungeon}' AND `
        }
        sql = sql.substring(0, sql.length-5)
        console.log(sql);
    }
    try {
        const result = await db.query(sql, []);
        //console.log ("db", result.rows);
        return result.rows;
    } catch (err) {
        return console.error(err.message);
    }
}

//remove all keys from db at weekly reset
export function truncateKeystones () {
    let sql = `DELETE FROM keystones`;
    db.run(sql, [], function(err){
        if (err) console.error(err)
    });
}

process.on('SIGINT', () => {
    db.close();
    console.log("Connection to database closed.");
    process.exit();
});