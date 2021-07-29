const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

function addRolePending (messageID, interaction) {
    let data = [messageID, interaction.member.id, interaction.options.get('target').user.id, interaction.options.get('role').role.id, interaction.commandName];
    let sql = `INSERT INTO 
                pending_roles (messageID, submitter, target, role, add_remove)
                VALUES(?, ?, ?, ?, ?)`;

    db.run(sql, data, function(err) {
        if (err) {
            return console.error(err.message);
        }
    });
}

function checkPendingReactions (reaction, member) {

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

module.exports = {
    addRolePending, checkPendingReactions
}