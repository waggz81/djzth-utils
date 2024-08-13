import {config} from "../config";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, GuildMember, PermissionsBitField, TextChannel} from "discord.js";
import {myLog, thisServer} from "../index";
import {hasRaidLeaderRole} from "../helpers";
import {createPendingEmbed} from "./addrole";

const access_control_channel = thisServer.channels.cache.get(config.access_control) as TextChannel;
module.exports = {
    data: new SlashCommandBuilder()
        .setName("removerole")
        .setDescription("Remove a role from a user")
        .addUserOption((option) => option.setName("target").setDescription("Select a user").setRequired(true))
        .addRoleOption((option) => option.setName("role").setDescription("Select a role").setRequired(true)),
    async execute(interaction: CommandInteraction) {
        await interaction.deferReply({ephemeral: true})
        if (!hasRaidLeaderRole(interaction.member as GuildMember)) {
            await interaction.editReply({content: "You do not have permission to use this command"}).catch(console.log);
            return;
        }
        const target = interaction.options.get('target')!.user!.username + '#' + interaction.options.get('target')!.user!.discriminator;
        const roleID = interaction.options.get('role')!.role!.id.toString();
        const targetHasRole = (interaction.options.get('target')!.member as GuildMember).roles.cache.has(interaction.options.get('role')!.role!.id);
        if (!targetHasRole) {
            await interaction.editReply({content: "Error: the selected user does not have the selected role!"});
            return;
        }

        if (config.approved_roles.indexOf(roleID) !== -1 || (interaction.member as GuildMember).permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            (interaction.options.get('target')!.member as GuildMember).roles.remove(roleID)
                .then(() => {
                    access_control_channel.send({content: `_ _\n${(interaction.member as GuildMember).displayName} removed the \`@${interaction.options.get('role')!.role!.name}\` role from \`${target}\``})
                        .then((msg) => {
                            interaction.editReply({content: "Completed! " + msg.url})
                        })
                        .catch(myLog);
                })
                .catch((error: Error) => {
                    myLog(error);
                    interaction.editReply({
                        content: `Error: ${error.name} - ${error.message}\n_ _\n` + `Role: ${interaction.options.get('role')!.role!.name}\n` + `Target: ${target}\n` + `Submitter: ${(interaction.member as GuildMember).displayName}`
                    });
                })
        } else {
            await interaction.reply({
                content: "This role is not auto approved and is pending review. You will be notified when it has been approved or denied.",
                ephemeral: true
            });

            createPendingEmbed(interaction, true);
        }
    }
};

