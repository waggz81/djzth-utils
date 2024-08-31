import * as http from "https";
import {
    ActionRowBuilder,
    ChannelType,
    CommandInteraction,
    EmbedBuilder,
    GuildMember,
    StringSelectMenuBuilder,
    StringSelectMenuComponent,
    StringSelectMenuOptionBuilder,
    TextChannel,
    ThreadChannel
} from "discord.js";
import {config} from "./config";
import {myLog, thisServer} from "./index";
import {addRolePending} from "./db";
import * as https from "https";

let blizztoken: string;
let tokenexpiration: number;

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

export function sendLFGPings(post: ThreadChannel, embedOnly: boolean = false, roles: string[] | null = null, sender: GuildMember | null) {
    const embed = new EmbedBuilder()
        .setTitle("Ping roles for this group")
        .setDescription("Choose the groups below you'd like to ping for this group, then click away from the selection menu to send it!");
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
    if (!embedOnly) {
        selectMenu.setDisabled(true);
    }
    select.addComponents(selectMenu)
    post.send({embeds: [embed], components: [select]}).then((post) => {
        if (!embedOnly && post.components) {
            setTimeout(() => {
                const newbutton = StringSelectMenuBuilder.from(post.components[0].components[0] as StringSelectMenuComponent);
                const newselect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(newbutton);
                post.edit({components: [newselect]}).catch(myLog);
            }, 1000 * 15);
        }
    }).catch(myLog);
    if (embedOnly) return;
    const lfgchannel = thisServer.channels.cache.get(config.lfgchannel);
    if (lfgchannel && lfgchannel.type === ChannelType.GuildText) {
        let roleMentions = '';
        if (roles) {
            roles.forEach(role => {
                roleMentions += `<@&${role}> `;
            })
        }
        lfgchannel.send({content: `A group is forming and is in search of players! [${post.name}](${post.url}) ${roleMentions}\n-# sent by <@${sender?.id}>`}).catch(myLog);
    }
}

export async function getBnetRoster (realm:string, guildslug:string) {
    await validateToken();
    return new Promise((resolve) => {
        const options = {
            "method": "GET",
            "hostname": "us.api.blizzard.com",
            "port": null,
            "path": `/data/wow/guild/${realm}/${guildslug}?namespace=profile-us&locale=en_US&=`,
            "headers": {
                "Authorization": `Bearer ${blizztoken}`
            }
        };

        webreq(options).then(async res => {
            //console.log(res);
            resolve(JSON.parse(<string>res));
        }).catch(() => {
            resolve(null)
        })
    });
}

async function getToken(): Promise<boolean> {

    const options = {
        hostname: 'oauth.battle.net', port: 443, path: '/token?=', method: 'POST', headers: {
            "Content-Type": "multipart/form-data; boundary=---011000010111000001101001",
            'Authorization': 'Basic ' + Buffer.from(config.battlenetclientid + ':' + config.battlenetsecret).toString('base64'),
        },
    };

    return new Promise((resolve, reject) => {

        const req = https.request(options, (res) => {
            let data = "";
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const body = JSON.parse(data);
                if (body.access_token) {
                    blizztoken = body.access_token;
                    tokenexpiration = Date.now() + (body.expires_in * 1000);
                    resolve(body)
                } else {
                    reject(data)
                }
            });

        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });

// Write data to request body
        req.write("-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"grant_type\"\r\n\r\nclient_credentials\r\n-----011000010111000001101001--\r\n");
        req.end();
    });
}

export async function validateToken() {
    return new Promise((resolve) => {
        if (blizztoken && tokenexpiration > Date.now()) {
            resolve(true);
           // console.log("token valid")
        } else {
           // console.log("missing or expired token, run gettoken")
            getToken().then(async () => {
                resolve(true)
               // console.log("token valid")
            })
        }
    });
}

export {blizztoken};
