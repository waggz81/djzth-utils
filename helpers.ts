import * as http from "https";
import {
    ActionRowBuilder,
    ChannelType,
    CommandInteraction,
    EmbedBuilder,
    GuildMember,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextChannel,
    ThreadChannel
} from "discord.js";
import {config} from "./config";
import {myLog, thisServer} from "./index";
import {addRolePending} from "./db";

export function webreq(options: http.RequestOptions) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            const body: string[] = [];
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                body.push(chunk);
            });
            res.on('end', () => {
                // console.log(res.statusCode, options.path, body.join(''));
                if (res.statusCode === 200) {
                    resolve(body.join(''));
                } else reject(res.statusCode);
            });

        });
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            reject(e);
        });

        req.end();
    })
}

export async function hasRaidLeaderRole(user: GuildMember) {
    let allowed = false;
    await user.fetch().then(() => {
        user.roles.cache.forEach((role) => {
            if (config.raidteamleaderroles.includes(role.id)) {
                allowed = true;
            }
        })
    }).catch(myLog);
    return allowed;
}

export function createPendingEmbed(interaction: CommandInteraction, remove: boolean = false) {
    const access_control_channel = thisServer.channels.cache.get(config.access_control) as TextChannel;

    const textstr = remove ? "remove from" : "granted";

    access_control_channel.send({
        "embeds": [{
            "title": "Pending Access Request",
            "description": `${(interaction.member as GuildMember).displayName} requests \`${interaction.options.get('target')!.user!.username}#${interaction.options.get('target')!.user!.discriminator}\` \
                                be ${textstr} the \`@${interaction.options.get('role')!.role!.name}\` role`,
        }]
    })
        .then((message) => {
            message.react('✅').catch(myLog);
            message.react('🚫').catch(myLog);
            addRolePending(message.id, interaction);
        }).catch(console.log)

}

export function sendLFGPings (post: ThreadChannel, embedOnly: boolean = false, roles: string[] | null = null) {
    const embed = new EmbedBuilder()
        .setTitle("Ping roles for this group")
        .setDescription("Choose the groups below you'd like to ping for this group. ");
    const select = new ActionRowBuilder<StringSelectMenuBuilder>();
    const selectMenu = new StringSelectMenuBuilder().setCustomId('lfgping')
        .setMinValues(1)
        .setMaxValues(3);
    let selectMenuOptions: Array<StringSelectMenuOptionBuilder> = [];
    let count = 0;

    for (const role of config.lfgpingroles) {
        if (count > 24) break;
        const thisRole = thisServer.roles.cache.get(role);
        if (thisRole) {
            selectMenuOptions.push(new StringSelectMenuOptionBuilder()
                .setLabel(thisRole.name)
                .setValue(thisRole.id));
            count++;
        }
    }
    selectMenu.addOptions(selectMenuOptions)
    select.addComponents(selectMenu)
    post.send({embeds: [embed], components: [select]}).catch(myLog);
    if (embedOnly) return;
    const lfgchannel = thisServer.channels.cache.get(config.lfgchannel);
    if (lfgchannel && lfgchannel.type === ChannelType.GuildText) {
        let roleMentions = '';
        if (roles) {
            roles.forEach(role => {
                roleMentions += `<@&${role}> `;
            })
        }
        lfgchannel.send({content: `A group is forming and is in search of players! [${post.name}](${post.url}) ${roleMentions}`}).catch(myLog);
    }
}
