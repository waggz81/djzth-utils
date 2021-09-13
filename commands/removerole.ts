import {config} from "../config";
import {addRolePending} from "../db";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, GuildMember} from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removerole")
        .setDescription("Remove a role from a user")
        .addUserOption((option) => option.setName("target").setDescription("Select a user").setRequired(true))
        .addRoleOption((option) => option.setName("role").setDescription("Select a role").setRequired(true)),
    async execute(interaction: CommandInteraction) {
        const target = interaction.options.get('target')!.user!.username + '#' + interaction.options.get('target')!.user!.discriminator;
        const roleID = interaction.options.get('role')!.role!.id.toString();
        if (config.access_control.includes(interaction.channelId)) {
            const targetHasRole = (interaction.options.get('target')!.member as GuildMember).roles.cache.has(interaction.options.get('role')!.role!.id);
            if (!targetHasRole) {
                await interaction.reply({ content: "Error: the selected user does not have the selected role!", ephemeral: true });
                return;
            }

            if (config.approved_roles.indexOf(roleID) !== -1 || (interaction.member as GuildMember).permissions.has('MANAGE_ROLES')) {
                await interaction.deferReply({ephemeral: false});
                (interaction.options.get('target')!.member as GuildMember).roles.remove(roleID)
                    .then(() => {
                        interaction.editReply({content: `_ _\n${(interaction.member as GuildMember).displayName} removed the \`@${interaction.options.get('role')!.role!.name}\` role from \`${target}\``});
                    })
                    .catch((error: Error) =>{
                        console.error(error);
                        interaction.editReply({
                            content: `Error: ${error.name} - ${error.message}\n_ _\n` +
                                `Role: ${interaction.options.get('role')!.role!.name}\n` +
                                `Target: ${target}\n`+
                                `Submitter: ${(interaction.member as GuildMember).displayName}`
                        });
                    })
            }
            else {
                await interaction.reply({content: "This role is not auto approved and is pending review. You will be notified when it has been approved or denied.", ephemeral: true});

                createPendingEmbed(interaction);
            }
        }
        else {
            await interaction.reply({ content: "Command disabled in this channel", ephemeral: true });
        }
    }
};

function createPendingEmbed (interaction: CommandInteraction) {
    interaction.channel!.send({
        "content": null,
        "embeds": [
            {
                "title": "Pending Access Request",
                "description": `${(interaction.member as GuildMember).displayName} requests \`${interaction.options.get('target')!.user!.username}#${interaction.options.get('target')!.user!.discriminator}\` \
                                be removed from the \`@${interaction.options.get('role')!.role!.name}\` role`,
            }
        ]
    })
        .then((message) => {
            message.react('✅').catch(console.error);
            message.react('🚫').catch(console.error);
            addRolePending(message.id, interaction);
        })
}