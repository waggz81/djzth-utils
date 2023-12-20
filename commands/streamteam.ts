import {config} from "../config";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Colors, CommandInteraction, EmbedBuilder} from "discord.js";
import * as http from "https";
import {myLog} from "../index";

let token: string = '';
const teamName:string = "djsandzth";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("streamteam")
        .setDescription("Get the status of all members of our stream team."),

    async execute(interaction: CommandInteraction) {
        const embed = new EmbedBuilder({
            title: `Stream Team Status`,
            description: `https://www.twitch.tv/team/${teamName}`,
            color: Colors.Blue,
            timestamp: Date.now()
        });
        await interaction.deferReply({ephemeral: true});
        const data = await getStreamTeamMembers();
        const streamers = await getLiveStreamers(JSON.parse(data).data[0].users);
        let name: string = "";
        let game: string = "";
        let viewers: string = "";
        streamers.forEach((element) => {
            name += `[${element.name}](https://www.twitch.tv/${element.login})\n`;
            game += `${element.game}\n`;
            viewers += `${element.viewers}\n`;
        });
        embed.addFields(
            {name: 'Twitch Name', value: name, inline: true},
            {name: 'Game', value: game, inline: true},
            {name: 'Viewers', value: viewers, inline: true},
        )
        interaction.editReply({
            content: "",
            embeds: [embed]
        });

    }
};

async function getToken(): Promise<boolean> {

    const postData = JSON.stringify({
        'client_id': config.twitchclientid,
        'client_secret': config.twitchclientsecret,
        'grant_type': 'client_credentials',
    });

    const options = {
        hostname: 'id.twitch.tv',
        port: 443,
        path: '/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
        },
    };

    const req = http.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            const body = JSON.parse(chunk);
            if (body.access_token) {
                token = body.access_token;
            }
        });
        res.on('end', () => {
            // console.log('No more data in response.');
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

// Write data to request body
    req.write(postData);
    req.end();
    if (token.length !== 0) {
        return true;
    } else {
        return false;
    }
}

async function validateToken(): Promise<boolean> {

    if (token.length === 0) {
        getToken().catch(myLog);
        return false;
    }

    const options = {
        hostname: 'id.twitch.tv',
        port: 443,
        path: '/oauth2/validate',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
        },
    };

    const req = http.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
//            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
//            console.log('No more data in response.');
        });
        if (res.statusCode !== 200) {
            getToken().catch(myLog);
            return false;
        }
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.end();
    return true;
}

async function getStreamTeamMembers(): Promise<string> {

    const valid = await validateToken();
    if (valid) {

        const options = {
            hostname: 'api.twitch.tv',
            port: 443,
            path: '/helix/teams?name=' + teamName,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
                'Client-Id': config.twitchclientid,
            },
        };

        const req = await webreq(options);
        return req as string;
    } else {
        return "?";
    }

}

async function getLiveStreamers(memberIDs: {
    'user_id': string,
    'user_name': string,
    'user_login': string
} []): Promise<{ 'login': string, 'name': string, 'game': string, 'viewers': number }[]> {
    // get streams
    let querystring = "";
    const maxlength = (memberIDs.length < 100) ? memberIDs.length : 100;
    for (let i = 0; i < maxlength; i++) {
        querystring += `user_id=${memberIDs[i].user_id}&`;
    }

    // return (querystring.slice(0,-1))

    const options = {
        hostname: 'api.twitch.tv',
        port: 443,
        path: '/helix/streams?' + querystring.slice(0, -1),
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'Client-Id': config.twitchclientid,
        },
    };
    const req = await webreq(options);
    const fields = JSON.parse(req as string);
    const filtered = fields.data.map((element: {
        user_login: string;
        user_name: string;
        game_name: string;
        viewer_count: number;
    }) => (
        {
            login: element.user_login,
            name: element.user_name,
            game: element.game_name,
            viewers: element.viewer_count,
        }
    ));
    return filtered;

}

function webreq(options: http.RequestOptions) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            const body: string[] = [];
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                body.push(chunk);
            });
            res.on('end', () => {
                resolve(body.join(''));
            });

        });
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            reject(e);
        });

        req.end();
    })
}

validateToken();
