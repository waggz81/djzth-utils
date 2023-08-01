import * as http from "https";
import {RequestOptions} from "https";
import {config} from "./config";
import {Guild, GuildChannel, TextChannel} from "discord.js";
import {client, myLog} from "./index";
import * as fs from 'fs';
import ErrnoException = NodeJS.ErrnoException;

const fileName = './jokesHistory.log';

// touch processed file
fs.closeSync(fs.openSync(fileName, 'a'));

const options: RequestOptions = {
    "method": "GET",
    "hostname": "icanhazdadjoke.com",
    "port": null,
    "path": "/",
    "headers": {
        "Accept": "application/json",
        "User-Agent": "https://discord.gg/djandzth waggz#1963"
    }
};

export async function dadjoke() {

    const logTimestamp = new Date();
    const guild = await client.guilds.fetch(config.guildID) as Guild;
    guild.channels.fetch(config.dad_jokes.channel).then(thisChan => {
        const req = http.request(options, (res: any) => {
            const chunks: any[] = [];

            res.on("data", (chunk: any) => {
                chunks.push(chunk);
            });

            res.on("end", () => {
                const body = JSON.parse(Buffer.concat(chunks).toString());
                myLog(body);

                fs.readFile(fileName, (err: ErrnoException | null, data: Buffer) => {
                    if (err) throw err;
                    if(data.includes(body.id)){
                        // exit function if exists
                        myLog(`${body.id} already sent!`);
                        dadjoke();
                    }
                    else {
                        // @ts-ignore
                        thisChan.send(body.joke).catch(myLog);
                        fs.appendFileSync(fileName, `${logTimestamp.toLocaleString()} - ${body.id} - ${body.joke}\n`)
                    }
                });
            });
        });

        req.end();
    }).catch(myLog);
}
