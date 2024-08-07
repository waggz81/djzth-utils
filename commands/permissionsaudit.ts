import {config} from "../config";
import {SlashCommandBuilder} from "@discordjs/builders";
import {
    AttachmentBuilder,
    CommandInteraction,
    GuildChannel,
    GuildMember,
    OverwriteType,
    PermissionOverwrites,
    PermissionResolvable,
    PermissionsBitField,
    Role,
    ThreadChannel
} from "discord.js";
import * as fs from "fs";
import { Parser } from "@json2csv/plainjs";
import {myLog} from "../index";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("permissionaudit")
        .setDescription("List all permission overrides on a channel or category")
        .addChannelOption((option) => option.setName("channel").setDescription("Select a channel").setRequired(true)),
    async execute(interaction: CommandInteraction) {
        if (config.access_control.includes(interaction.channelId)) {
            const thisChan: GuildChannel | ThreadChannel = interaction.guild!.channels.cache.get(interaction.options.get('channel')!.channel!.id)!;
            const flags = Object.entries(PermissionsBitField.Flags);
            const permissionsData: any[] = [];
            // @ts-ignore
            myLog(thisChan.permissionOverwrites.cache);
            // @ts-ignore
            thisChan.permissionOverwrites.cache.each((roleOrMember: PermissionOverwrites) => {
                let thisRole: Role;
                let thisMember: GuildMember;
                let perms: PermissionsBitField;
                let roleOrMemberName: string = "";

                if (roleOrMember.type === OverwriteType.Role) {
                    thisRole = interaction.guild!.roles.cache.get(roleOrMember.id) as Role;
                    perms = thisChan.permissionsFor(thisRole);
                    roleOrMemberName = thisRole.name;
                }
                if (roleOrMember.type === OverwriteType.Member) {
                    thisMember = interaction.guild!.members.cache.get(roleOrMember.id) as GuildMember;
                    perms = thisChan.permissionsFor(thisMember);
                    roleOrMemberName = thisMember.displayName;
                }
                let thisRoleOrMember = {};
                thisRoleOrMember = Object.assign(thisRoleOrMember, {
                    "Member Or Role": roleOrMemberName
                });
                flags.forEach((flag) => {
                    const permName = flag[0];
                    if (perms.has(flag as PermissionResolvable)) {
                        thisRoleOrMember = Object.assign(thisRoleOrMember, {
                            [permName]: "TRUE"
                        });
                    } else {
                        thisRoleOrMember = Object.assign(thisRoleOrMember, {
                            [permName]: "FALSE"
                        });
                    }
                })
                permissionsData.push(thisRoleOrMember);
            });

            if (permissionsData.length) {
                // convert JSON array to CSV string
                try {
                    const opts = {};
                    const parser = new Parser(opts);
                    const csv = parser.parse(permissionsData);
                    console.log(csv);
                    // write CSV to a file
                    fs.writeFile(thisChan.name + '_permissionOverrides.csv', csv as string, (error) => {
                        if (!error) {
                            const file = new AttachmentBuilder(thisChan.name + '_permissionOverrides.csv')
                            interaction.reply({ephemeral: true, files: [file]});
                        }
                    })
                } catch (err) {
                    console.error(err);
                }

            } else {
                await interaction.reply({content: "No Permission Overrides for #" + thisChan.name, ephemeral: true});
            }
        }
        else {
            await interaction.reply({ content: "Command disabled in this channel", ephemeral: true });
        }
    }
}
