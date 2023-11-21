import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, EmbedBuilder} from "discord.js";
import {config} from "../config";
import {myLog, thisServer} from "../index";
import Table = require('easy-table')
import {db} from "../db";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("automodreport")
        .setDescription("Get report of automod actions")
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('Get list of channels')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('users')
                .setDescription('Get list of users')
        ),

    async execute(interaction: CommandInteraction) {
        if (thisServer.members.cache.get(interaction.user.id)?.roles.cache.has(config.moderatorrole)) {
            const list: any[] = [];
            myLog(interaction);
            const subcommand = interaction.options.data[0].name;
            const column = (subcommand === "users") ? "executorId" : "channelId";
            const sql = `select *, count(${column}) as count
                                                from auditlog
                                                group by ${column}
                                                order by count(${column}) desc
                                                limit 50`;
            myLog(sql);
            db.all(sql, [], (err: Error, rows: any) => {
                if (err) {
                    myLog(err);
                }
                if (rows) {
                    rows.forEach((row: any) =>{
                        myLog(row);
                        switch (subcommand) {
                            case "users":
                                list.push({"Username": row.username, "Count": row.count});
                                break;
                            case "channels":
                                list.push({"Channel": row.channelName, "Category": row.channelParentName, "Count": row.count});
                                break;
                            default:
                                break;
                        }
                    });
                    const embedResult = new EmbedBuilder()
                        .setTitle(`Top AutoMod Flaggers (${subcommand}) :`)
                        .setDescription(`\`\`\`${Table.print(list)}\`\`\``);
                    interaction.reply({ embeds: [embedResult], ephemeral: true});
                }
            });
        }
        else {
            await interaction.reply({content: "You do not have permission to use this command", ephemeral: true});
        }
    }
}