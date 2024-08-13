import * as http from "https";
import {CommandInteraction, GuildMember, TextChannel} from "discord.js";
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