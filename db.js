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
        console.log(`Row(s) updated: ${this.changes}`);

    });
}

function checkPendingReactions (reaction, member) {
    console.log(reaction);
    console.log (member);

    if (!member.permissions.has('MANAGE_ROLES')) return;

    let sql = `SELECT * FROM pending_roles`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(row);
            if (row['messageID'] == reaction.message.id) {
                console.log('message id found');
                if (reaction.emoji.name == '✅') {
                    console.log('emoji is true');
                }
                if (reaction.emoji.name == '🚫') {
                    console.log('emoji is false');
                }
            }
        });
    });
}

module.exports = {
    addRolePending, checkPendingReactions
}