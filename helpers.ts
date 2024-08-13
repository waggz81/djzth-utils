import * as http from "https";
import {GuildMember} from "discord.js";
import {config} from "./config";
import {myLog} from "./index";

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