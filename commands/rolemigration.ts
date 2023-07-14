import {memberNicknameMention, SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, GuildMember, MessageOptions, Role, TextChannel} from "discord.js";


module.exports = {
    data: new SlashCommandBuilder()
        .setName("migrateroles")
        .setDescription("Admin only - moving roles around")
        .addRoleOption((option) => option.setName("source").setDescription("Select a source role").setRequired(true))
        .addRoleOption((option) => option.setName("dest").setDescription("Select a destination role").setRequired(true)),
    async execute(interaction : CommandInteraction) {
        if (interaction.memberPermissions?.has('ADMINISTRATOR')) {
            // do stuff
            let memberList = '';
            let migratedMembers = '';
            const sourceRole: Role = interaction.options.get('source')!.role as Role
            const destRole: Role = interaction.options.get('dest')!.role as Role

            sourceRole?.members.forEach(member =>{
                memberList += member.user.tag + '\n';
                if (!member.roles.cache.has(destRole.id)) {
                    member.roles.add(destRole);
                    migratedMembers += member.user.tag + '\n';
                }
            })
            await interaction.reply({content: `Members of \`${sourceRole.name}\`:\n${memberList}\nMigrated Members to \`${destRole.name}\`:\n${migratedMembers}`, ephemeral: true})
        }
        else {
            await interaction.reply({ content: 'Not an administrator!', ephemeral: true });
        }
    }
};