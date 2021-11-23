import {MessageEmbed} from "discord.js";

type KeystoneEntry = {
    character: string,
    name: string,
    playerclass: string,
    spec: string,
    role: string,
    score_all: string,
    score_tank: string,
    score_healer: string,
    score_dps: string,
    guild: string,
    key_level: number,
    dungeon_name: string,
    timestamp: number,
    uploader: string
}

type KeystonelistEntry = {
    Name: string;
    Level: number;
    Dungeon: string;
}

type KeystonePages = {
    uuid: string,
    pages: number,
    embeds: MessageEmbed[]
}