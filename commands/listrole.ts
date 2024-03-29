import {SlashCommandBuilder} from "@discordjs/builders";

import Table = require('easy-table')
import {CommandInteraction, EmbedBuilder, GuildMember, Role} from "discord.js";
import {EmbedPages, RoleListEntry} from "../typings/types";
import {randomUUID} from "crypto";


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
            const embedResult = new EmbedBuilder().setTitle(`Users with \`@${thisRole.name}\`:`).setDescription(`\`\`\`${Table.print(list)}\`\`\``); // <@&ROLE_ID>
            await interaction.reply({ embeds: [embedResult], ephemeral: true});
    }
};

async function RoleListPageEmbed(list: GuildMember[]) {
    const roleListPages: EmbedPages = {
        pages: 1,
        uuid: randomUUID(),
        embeds: []
    };
    const fieldSize = 1000;

    let nameField: string = "";
    let idField: string = "";
    for (const entry of list) {
        nameField = entry.displayName;
        idField = entry.id;

        if (nameField.length < fieldSize && idField.length < fieldSize) {
            roleListPages.embeds[roleListPages.pages - 1] = new EmbedBuilder({})
                .setTitle('Users with Role')
                .addFields(
                    {name: 'Name', value: nameField, inline: true},
                    {name: 'Discord ID', value: idField, inline: true}
                );
        } else {
            nameField = entry.displayName;
            idField = entry.id;
            roleListPages.pages = roleListPages.pages + 1;
        }
    }

    if (roleListPages.embeds.length !== roleListPages.pages) // we missed the last entry on a new page, add it
    {
        const embed = new EmbedBuilder()
            .setTitle('Users with Role')
            .addFields(
                {name: 'Name', value: nameField, inline: true},
                {name: 'Discord ID', value: idField, inline: true},
            )
        roleListPages.embeds.push(embed as EmbedBuilder);
    }
    return roleListPages;
}
