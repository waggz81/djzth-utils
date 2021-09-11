import {SlashCommandBuilder} from "@discordjs/builders";

const Table = require('easy-table')
import {config} from "../config";


module.exports = {
    data: new SlashCommandBuilder()
        .setName("listrole")
        .setDescription("List all users with a role")
        .addRoleOption((option) => option.setName("role").setDescription("Select a role").setRequired(true)),
    async execute(interaction) {
        const Role = interaction.options.get('role').role;
        if (config.access_control.includes(interaction.channelId)) {
            let list = [];
            const Members = interaction.guild.members.cache.filter(member => member.roles.cache.find(role => role == Role));
            Members.forEach ((member)=> {
                list.push({ "Nickname": member.nickname || member.user.username, "Discord Tag": member.user.tag});
            });
            console.log(list)

            // noinspection JSVoidFunctionReturnValueUsed,TypeScriptValidateJSTypes
            interaction.reply({ content: `Users with \`@${Role.name}\`:\n\`\`\`${Table.print(list)}\`\`\``, ephemeral: true});

        }
        else {
            await interaction.reply({ content: "Command disabled in this channel", ephemeral: true });
        }
    }
};
