import {SlashCommandBuilder} from "@discordjs/builders";

import Table = require('easy-table')
import {CommandInteraction, MessageEmbed, Role} from "discord.js";


module.exports = {
    data: new SlashCommandBuilder()
        .setName("listrole")
        .setDescription("List all users with a role")
        .addRoleOption((option) => option.setName("role").setDescription("Select a role").setRequired(true)),
    async execute(interaction : CommandInteraction) {
        const thisRole: Role = interaction.guild!.roles.cache.get(interaction.options.get('role')!.role!.id)!;
            const list: any[] = [];
            // @ts-ignore
            const Members = interaction.guild!.members.cache.filter((member) => member.roles.cache.find((role: Role) => role === thisRole));
            Members.forEach ((member)=> {
                list.push({ "Nickname": member.nickname || member.user.username, "Discord Tag": member.user.tag});
            });
            const embedResult = new MessageEmbed().setTitle(`Users with \`@${thisRole.name}\`:`).setDescription(`\`\`\`${Table.print(list)}\`\`\``); // <@&ROLE_ID>
            await interaction.reply({ embeds: [embedResult], ephemeral: true});
    }
};
