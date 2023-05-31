// tslint:disable-next-line:no-var-requires
import {CommandInteraction, GuildMember, Message, MessageReaction} from "discord.js";
import {randomUUID} from "crypto";

// tslint:disable-next-line:no-var-requires
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db', (err: Error) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

// from https://blog.pagesd.info/2019/10/29/use-sqlite-node-async-await/
// Hack to look like node-postgres
// (and handle async / await operation)
db.query = function (sql: string, params: any[]) {
    const that = this;
    return new Promise((resolve, reject) => {
        that.all(sql, params, (error: Error, rows: object[]) => {
            if (error)
                reject(error);
            else
                resolve({ rows });
        });
    });
};

// someone used addrole command for a role that isn't auto approved and requires someone with manage roles permission to approve it
export function addRolePending (messageID: string, interaction: CommandInteraction) {
    const data = [messageID, (interaction.member as GuildMember).id, interaction.options.get('target')!.user!.id, interaction.options.get('role')!.role!.id, interaction.commandName];
    const sql = `INSERT INTO
                    pending_roles (messageID, submitter, target, role, add_remove)
                    VALUES(?, ?, ?, ?, ?)`;
    db.run(sql, data, (err: Error) => {
        if (err) {
            console.error(err.message);
        }
    });
}

// a member with manage roles permission reacted to a message, let's see if it's in the pending role requests table
export function checkPendingReactions (reaction: MessageReaction, member: GuildMember) {

    if (!member.permissions.has('MANAGE_ROLES')) return;

    const sql = `SELECT * FROM pending_roles WHERE messageID = ${reaction.message.id}`;

    db.get(sql, [], (err: Error, row: any) => {
        if (err) {
            throw err;
        }
        if (row) {
            reaction.message.channel.messages.fetch(reaction.message.id)
                .then((message: Message) => {
                    if (message.guild) {
                        let approved = 'rejected';

                        const role = message.guild.roles.cache.get(row.role);
                        if (role) {
                            if (reaction.emoji.name === '✅') {
                                approved = 'approved';
                                message.guild.members.fetch(row.target)
                                    .then(target => {
                                        switch (row.add_remove) {
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
                        }
                        if (reaction.emoji.name === '🚫') {
                            resolvePending(message, member, false);
                        }
                        message.guild.members.fetch(row.submitter)
                            .then(submitter => {
                                submitter.send(`Your role request for ${message.guild!.members.cache.get(row.target)!.displayName} has been ${approved} - ${message.url}`).catch(console.error)
                            })
                    }
                })
        }
    });
}

// update embed of pending role requests
function resolvePending (message: Message, member: GuildMember, approved = false) {
    let color = 15141120;
    const footer = (approved ? "Approved" : "Rejected") + ` by ${member.displayName}`;
    if (approved) {
        color = 59136;
    }
    const embed = [
                {
                    "title": "Completed Access Request",
                    "description": message.embeds[0].description as string,
                    "color": color,
                    "footer": {
                        "text": footer
                    }
                }
            ]

    message.edit({content: "_ _", embeds: embed }).catch(console.error)
    message.reactions.removeAll()
        .then(() => {
            db.run("DELETE FROM pending_roles WHERE messageID=(?)", message.id, (err: Error) => {
                if (err) {
                    console.error(err)
                }
            });
        }).catch(console.error)
}

// add newly submitted keystone data to database
export function uploadKeystones (entry: any) {
    // check timestamp on key entry and only update if newer
    const sql = `SELECT timestamp FROM keystones WHERE character = '${entry.character}'`;

    db.get(sql, [], (err: Error, row: any) => {
        if (err) {
            throw err;
        }
        const timestamp = (typeof row === 'undefined') ? 0 : row.timestamp;
        if (Math.sign(entry.timestamp - timestamp)) {
            console.log("Updating ", entry.character);
            const sql2 = `REPLACE INTO
                    keystones (character, name, class, spec, role, score_all, score_tank, score_healer, score_dps, guild, key_level, dungeon_name, timestamp, uploader)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(sql2, Object.values(entry), (err2: Error) => {
                if (err2) {
                    return console.error(err2.message);
                }
            });
        }
    });
}

// get keystone data from database
export async function getKeystones (min?: number|null, max?: number|null, dungeon?: string|null) {
    // base sql query
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
    }
    try {
        const result = await db.query(sql, []);
        return result.rows;
    } catch (err) {
        return console.error((err as Error).message);
    }
}

// remove all keys from db at weekly reset
export function truncateKeystones (timestamp: number) {
    const sql = `DELETE FROM keystones WHERE timestamp < ?`;
    db.run(sql, [timestamp], (err: object) => {
        if (err) console.error(err)
    });
}

export async function userLogin (userData: any) {


    let uuid = randomUUID();
    const sql = "SELECT * FROM users WHERE id = ?";
    const result = await db.query(sql, [userData.id])

    console.log(result)
    if (result.rows.length === 0){
        // insert
        const sql2 = "INSERT INTO users (uuid, id, username, discriminator, avatar) VALUES (?, ?, ?, ?, ?)"
        db.run(sql2, [uuid, userData.id, userData.username, userData.discriminator, userData.avatar], (err:object) => {
            if (err){
                console.error (err);
                return(err);
            }
        })
    }
    else {
        uuid = result.rows[0].uuid;
    }

    return uuid;
}

export async function getAuthorizedUsers () {
    const sql = "SELECT uuid,id FROM users";
    const result = await db.query(sql, []);
    return result.rows;
}

export async function addAbsence (team?:string, startDate?:Date, duration?:number) {
    //
}
process.on('SIGINT', () => {
    db.close();
    process.exit();
});