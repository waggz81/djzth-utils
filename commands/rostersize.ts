import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, EmbedBuilder} from "discord.js";
import {getBnetRoster} from "../helpers";
import {config} from "../config";
import {myLog} from "../index";

const guilds: {realm:string, guildslug: string}[] = [];
if (typeof (config.bnetguilds) !== undefined) {
    for (const element of Object.entries(config.bnetguilds)) {
        guilds.push(element[1] as  {realm:string, guildslug: string})
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rostersize")
        .setDescription("Get current guild roster sizes from Battle.net API"),
    async execute(interaction: CommandInteraction) {
        await interaction.deferReply({ephemeral: true});
        let field1 = '';
        let field2 = '';
        let field3 = '';
        for await (const guild of guilds) {
           await getBnetRoster(guild.realm, guild.guildslug).then((guild) => {// console.log(guild)
                    // @ts-ignore
               field1 += `${guild.name}\n`;
                    // @ts-ignore
               field2 += `${guild.realm.name}\n`;
                    // @ts-ignore
               field3 += `${guild.member_count}\n`;
            })
        }
        const embed = new EmbedBuilder()
            .setTitle("Guild Roster Member Counts")
            .addFields(
                {name: "Guild", value: field1, inline: true},
                {name: "Realm", value: field2, inline: true},
                {name: "Members", value: field3, inline: true}
            )
        interaction.editReply({embeds: [embed]}).catch(myLog);
    }
}


