import * as http from "https";
import {RequestOptions} from "https";
import {config} from "./config";
import {Guild, GuildChannel, TextChannel} from "discord.js";
import {client} from "./index";

const options: RequestOptions = {
    "method": "GET",
    "hostname": "dad-jokes.p.rapidapi.com",
    "port": null,
    "path": "/random/joke",
    "headers": {
        "X-RapidAPI-Key": config.dad_jokes.rapidapikey,
        "X-RapidAPI-Host": "dad-jokes.p.rapidapi.com",
        "useQueryString": "true"
    }
};

export async function dadjoke() {

    const guild = client.guilds.cache.get(`${BigInt(config.guildID)}`) as Guild;
    console.log(guild)
    let joke:string[];
    const channel:TextChannel = guild.channels.cache.get(config.dad_jokes.channel) as TextChannel;
    const req = http.request(options, (res: any) => {
        const chunks: any[] = [];

        res.on("data", (chunk: any) => {
            chunks.push(chunk);
        });

        res.on("end", () => {
            const body = Buffer.concat(chunks);
            console.log(JSON.parse(body.toString()));
            joke = JSON.parse(body.toString()).body[0];
            console.log(joke)
            // @ts-ignore
            channel.send(joke.setup)
            // @ts-ignore
            channel.send(`||${joke.punchline}||`);
        });
    });

    req.end();
}
