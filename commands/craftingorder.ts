import {embedLength, SlashCommandBuilder} from "@discordjs/builders";
import {
    ActionRowBuilder,
    APIEmbedField,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    CommandInteraction,
    EmbedBuilder,
    Events,
    GuildForumTag,
    Interaction,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from "discord.js";
import * as https from "https";
import {client, myLog, thisServer} from "../index";import {config, NODE_ENV} from "../config";
import {db} from "../db";
import {webreq} from "../helpers";

let blizztoken: string;
let tokenexpiration: number;
let refreshTime: number;
let refreshActive = false;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("recipesearch")
        .setDescription("List all users with a known profession recipe")
        .addStringOption(option => option.setName("profession")
            .setDescription("The profession you want to search in")
            .setRequired(true)
            .addChoices({name: "Alchemy", value: "Alchemy"}, {
                name: "Blacksmithing", value: "Blacksmithing"
            }, {name: "Enchanting", value: "Enchanting"}, {
                name: "Engineering", value: "Engineering"
            }, {name: "Herbalism", value: "Herbalism"}, {
                name: "Inscription", value: "Inscription"
            }, {name: "Jewelcrafting", value: "Jewelcrafting"}, {
                name: "Leatherworking", value: "Leatherworking"
            }, {name: "Mining", value: "Mining"}, {name: "Skinning", value: "Skinning"}, {
                name: "Tailoring", value: "Tailoring"
            }))
        .addStringOption(option => option.setName('search')
            .setDescription('The recipe you want to search for')
            .setRequired(true)),

    async execute(interaction: CommandInteraction) {
        console.log(interaction)
        let recipesNames: string = '';
        let recipesProf: string = '';
        await interaction.deferReply({ephemeral: true});
        const embed = new EmbedBuilder()
            .setTitle("Results");
        db.all(`select * from profession_recipes
                    where profession_name = ?
                    and recipe_name LIKE ?`, [interaction.options.get('profession')?.value, `%${interaction.options.get('search')?.value}%`], function (err: Error, results: any) {
            if (err) {
                myLog(err)
            } else {
                console.log(results);
                if (results.length === 0) {
                    interaction.editReply({content: "No results. Please try again with a different search term."});
                    return;
                }
                let count: number = 0;
                const selectMenu = new StringSelectMenuBuilder().setCustomId('recipesearch');
                let selectMenuOptions: Array<StringSelectMenuOptionBuilder> = [];
                for (const result of results) {
                    if (count > 24) break;
                    console.log(result)
                    recipesNames += result.recipe_name + '\n';
                    recipesProf += result.tier_name + '\n';
                    selectMenuOptions.push(new StringSelectMenuOptionBuilder()
                        .setLabel(result.recipe_name)
                        .setValue(result.recipe_id.toString()));
                    count++;
                }
                console.log(selectMenuOptions);
                selectMenu.addOptions(selectMenuOptions)
                embed.addFields({name: "Recipes", value: recipesNames, inline: true}, {
                    name: "Profession", value: recipesProf, inline: true
                })
                const embeds: EmbedBuilder[] = [];
                embeds.push(embed);
                if (count > 24) {
                    embeds.push(new EmbedBuilder().setTitle(":warning:  **SEARCH RESULTS EXCEEDED** :warning:")
                        .setDescription("Try to narrow down your search with a more exact name if you don't see what you're looking for in this list.")
                        .setColor(Colors.Red));
                }
                const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)

                interaction.editReply({embeds: embeds, components: [row]});
            }
        });
    }
};

let interactions: { interaction: Interaction, id: string }[] = [];
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName !== 'recipesearch') return;
        interactions.push({interaction: interaction, id: interaction.id});
        return;
    }
    if (interaction.isButton()) {
        if (!interaction.customId.startsWith('recipesearch')) return;
        const post = interaction.channel;
        if (post?.isThread()) {
            const userId = interaction.customId.split('::')[1];
            interaction.deferUpdate();
            if (interaction.user.id === userId) {
                post?.delete().catch(myLog)
            } else {
                post.send({content: `Sorry <@${interaction.user.id}>, only the request owner or a moderator can close this request.`});
            }

        }
    }
    if (interaction.isStringSelectMenu()) {
        interaction.deferReply({ephemeral: true});
        console.log(interactions)
        if (interaction.customId !== 'recipesearch') return;
        const original = interactions.find(({id}) => id === interaction.message.interaction?.id);
        console.log(original?.interaction);
        console.log(interaction);
        if (original?.interaction.isRepliable()) original.interaction.deleteReply().catch(myLog).then(() => {
            interactions = interactions.filter(function (id) {
                return id.id != interaction.message.interaction?.id;
            });
        })
        console.log(interactions)
        const embed = new EmbedBuilder();
        await db.get(`select * from profession_recipes
                    where recipe_id = ?`, [interaction.values[0],], async function (err: Error, results: any) {
            if (err) {
                console.log(err)
            } else {
                let days = 30;
                const filterlastlogin = Date.now() - (1000 * 86400 * days);
                await db.all(` 
                                 SELECT guild_members.character_name,
                                       guild_members.realm,
                                       guild_members.guild,
                                       profession_skills.skill_level,
                                       profession_skills.max_skill_level,
                                       profession_recipes.recipe_name,
                                       profession_skills.profession_tier_name,
                                       guild_members.player_notes,
                                       guild_members.last_login
                                FROM   guild_members
                                       LEFT JOIN character_known_recipes
                                              ON guild_members.blizz_character_id =
                                                 character_known_recipes.character_id
                                       LEFT JOIN profession_recipes
                                              ON character_known_recipes.recipe_id =
                                                 profession_recipes.recipe_id
                                       LEFT JOIN profession_skills
                                              ON guild_members.blizz_character_id =
                                                 profession_skills.character_id
                                                 AND profession_skills.profession_tier_id =
                                                     profession_recipes.tier_id
                                WHERE  character_known_recipes.recipe_id = ?
                                AND guild_members.last_login > ?`, [results.recipe_id, filterlastlogin], (err: Error, crafters: any) => {
                    if (err) myLog(err);

                    console.log(crafters);
                    // @ts-ignore
                    crafters = crafters.sort((a, b) => {
                        const skillA = a.skill_level;
                        const skillB = b.skill_level;
                        if (skillA > skillB) {
                            return -1;
                        }
                        if (skillA < skillB) {
                            return 1;
                        }
                        return 0;
                    });
                    let field1: string[] = [''];
                    let field2: string[] = [''];
                    let field: number = 0;
                    for (const crafter of crafters) {
                        let notes = crafter.player_notes || "no guild notes";
                        const addName = `* ${crafter.character_name}-${crafter.realm[0].toUpperCase() + crafter.realm.slice(1)}\n * ${crafter.skill_level}/${crafter.max_skill_level}\n`
                        const addGuild = `* ${notes}\n * ${crafter.guild}\n`;

                        if (field1[field].length + addName.length > 1023 || field2[field].length + addGuild.length > 1023) {
                            field++;
                            field1[field] = '';
                            field2[field] = '';
                        }
                        field1[field] += addName;
                        field2[field] += addGuild;
                    }
                    embed.setTitle(`${results.recipe_name} Crafters (online last ${days} days)`)
                        .setDescription(`${results.tier_name}`);
                    for (let i = 0; i <= field; i++) {
                        const testFields: Array<APIEmbedField> = [];
                        testFields.push({name: 'Character / Skill', value: field1[i], inline: true})
                        testFields.push({name: 'Guild Note', value: field2[i], inline: true})
                        if (i < field) testFields.push({name: '\u200b', value: '\u200b'})
                        const testEmbed = new EmbedBuilder(embed.data);
                        testEmbed.addFields(testFields)
                        if (embedLength(testEmbed.data) >= 6000) {
                            break;
                        } else {
                            embed.addFields(testFields)
                        }
                    }
                    const close = new ButtonBuilder()
                        .setCustomId('recipesearch::' + interaction.user.id)
                        .setLabel('Close Post')
                        .setStyle(ButtonStyle.Danger);
                    const actionrow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(close)

                    thisServer.channels.fetch(config.craftingorderschannel).then((channel) => {
                        if (!channel?.isThreadOnly()) {
                            console.log("Not a forum channel")
                            return;
                        } else {
                            channel.threads.create({
                                name: results.recipe_name, message: {embeds: [embed], components: [actionrow]}
                            }).then((post) => {
                                post.members.add(interaction.user).catch(myLog);

                                let tag = channel.availableTags.find(tag => tag.name === results.profession_name);
                                if (!tag) {
                                    const newTags = channel.availableTags.concat({name: results.profession_name} as GuildForumTag);
                                    channel.setAvailableTags(newTags).then(() => {
                                        tag = channel.availableTags.find(tag => tag.name === results.profession_name);
                                        post.setAppliedTags([tag!.id]).catch(myLog);
                                    }).catch(myLog);
                                } else {
                                    post.setAppliedTags([tag.id]).catch(myLog);
                                }
                            }).catch(myLog)
                        }
                    })
                    interaction.deleteReply();
                })


            }

        });
    }
});

async function getGowRoster(gowAPIkey: string) {
    const customPromise: Promise<unknown> = new Promise((resolve, reject) => {
        const options = new URL(`https://api.guildsofwow.com/roster/list?apiKey=${gowAPIkey}`);
        https.get(options, resp => {
            let data = "";
            // A chunk of data has been recieved.
            resp.on("data", chunk => {
                data += chunk;
            });
            // The whole response has been received. Print out the result.
            resp.on("end", () => {
                let result = JSON.parse(data).data;
                resolve(result);
            });
            resp.on("error", err => {
                myLog("Error: " + err.message);
                reject(err.message)
            });
        })
    });
    return customPromise;
}

async function updateGuildRosters() {
    await validateToken();
    if ((refreshTime && Date.now() - refreshTime < (6 * 60 * 1000)) || refreshActive) {
        console.log("skipping roster update", Date.now() - refreshTime, refreshTime, refreshActive);
        return;
    } else {
        console.log("Begin roster update...");
    }
    refreshActive = true;
    let members: {
        name: string,
        armoryLink: string,
        playerNotes: string,
        level: number,
        lastLoginTimestamp: number,
        faction: string,
        blizzid: number,
        realm: number,
        guild: number,
        class: string,
        race: string,
        rank: string,
        last_imported: number,
        deletion_flag: number,
    }[] = []
    let guilds: Set<string> = new Set();
    let realms: Set<string> = new Set();

    await Promise.all(config.gowAPIkeys.map(async (key: string) => {

        const result: any = await getGowRoster(key);
        for await (const member of result.roster) {
            await getBlizzProfile(member.armoryLink).then(async (profile) => {
                const realm = member.armoryLink.split("/")[5];
                let lastLogin: number = 0;
                let flagForDelete = 0;
                if (profile) {
                    try {
                        // @ts-ignore
                        lastLogin = profile.last_login_timestamp;
                        // @ts-ignore
                        realms.add(JSON.stringify({
                            // @ts-ignore
                            realm_id: profile.realm.id, // @ts-ignore
                            realm_name: profile.realm.name, // @ts-ignore
                            realm_slug: profile.realm.slug
                        }));
                        guilds.add(JSON.stringify({
                            // @ts-ignore
                            guild_name: profile.guild.name, // @ts-ignore
                            realm: profile.guild.realm.id, gow_slug: result.guildPermaUrl, // @ts-ignore
                            blizz_id: profile.guild.id
                        }));
                    } catch (err) {
                        console.log(profile);
                        console.log(err)
                        console.log("flag for delete")
                        flagForDelete = 1;
                    }
                }
                members.push({
                    name: member.name,
                    armoryLink: decodeURI(member.armoryLink),
                    playerNotes: member.playerNotes,
                    level: member.level,
                    lastLoginTimestamp: lastLogin ? lastLogin : member.lastLoginTimestamp,
                    faction: member.factionName, // @ts-ignore
                    blizzid: profile ? profile.id : -1,
                    realm: realm,
                    guild: result.guildPermaUrl,
                    class: member.className,
                    race: member.raceName,
                    rank: member.guildRankText,
                    last_imported: Date.now(),
                    deletion_flag: flagForDelete
                });

            })

        }
    }));

    const stmt1 = db.prepare(`INSERT OR REPLACE INTO guilds 
                                (guild_name, gow_slug, blizz_id, realm)  
                                VALUES (?, ?, ?, ?)`);
    guilds.forEach(guild => {
        const obj: { guild_name: string, realm: number, gow_slug: string, blizz_id: number } = JSON.parse(guild);
        stmt1.run([obj.guild_name, obj.gow_slug, obj.blizz_id, obj.realm])
    })


    const stmt2 = db.prepare(`INSERT OR REPLACE INTO realms 
                                (realm_name, realm_slug, realm_id)  
                                VALUES (?, ?, ?)`);
    realms.forEach(realm => {
        const obj: { realm_name: string, realm_slug: string, realm_id: number } = JSON.parse(realm);
        stmt2.run([obj.realm_name, obj.realm_slug, obj.realm_id])
    })


    db.serialize(function () {
        const stmt3 = db.prepare(`INSERT INTO guild_members
                                (character_name, 
                                level, 
                                last_login, 
                                player_notes, 
                                armory_link, 
                                faction, 
                                blizz_character_id, 
                                realm, 
                                guild, 
                                class, 
                                race, 
                                rank, 
                                last_login_datetime, 
                                last_imported, 
                                deletion_flag)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                ON CONFLICT (armory_link) DO UPDATE SET
                                character_name = ?,
                                level = ?, 
                                last_login = ?, 
                                player_notes = ?, 
                                faction = ?, 
                                blizz_character_id = ?, 
                                realm = ?, 
                                guild = ?, 
                                class = ?, 
                                race = ?, 
                                rank = ?, 
                                last_login_datetime = ?, 
                                last_imported = ?, 
                                deletion_flag = ?
                                WHERE armory_link = ?`);
        members.forEach(member => {
            stmt3.run([member.name, member.level, member.lastLoginTimestamp, member.playerNotes, member.armoryLink, member.faction, member.blizzid, member.realm, member.guild, member.class, member.race, member.rank, new Date(member.lastLoginTimestamp).toISOString(), member.last_imported, member.deletion_flag, member.name, member.level, member.lastLoginTimestamp, member.playerNotes, member.faction, member.blizzid, member.realm, member.guild, member.class, member.race, member.rank, new Date(member.lastLoginTimestamp).toISOString(), member.last_imported, member.deletion_flag, member.armoryLink]);
        });
        stmt3.finalize(function (err: Error) {
            if (err) console.log(err); else {
                console.log("Table 'guild_members' updated successfully.");
                refreshTime = Date.now();
            }
        });
    });

}

async function getBlizzProfile(link: string) {

    return new Promise((resolve) => {
        const realm = link.split("/")[5];
        const char = link.split("/")[6];

        const options = {
            "method": "GET",
            "hostname": "us.api.blizzard.com",
            "port": null,
            "path": `/profile/wow/character/${realm}/${char}?namespace=profile-us&locale=en_US&=`,
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

async function validateToken() {
    return new Promise((resolve) => {
        if (blizztoken && tokenexpiration > Date.now()) {
            resolve(true);
            console.log("token valid")
        } else {
            console.log("missing or expired token, run gettoken")
            getToken().then(async () => {
                resolve(true)
                console.log("token valid")
            })
        }
    });
}

async function updateCharacterProfessions() {

    db.all(`SELECT character_name as name, realm, last_login, cached_professions 
            FROM guild_members
            WHERE (cached_professions < last_login
            OR cached_professions IS NULL)
            AND blizz_character_id != '-1'
            LIMIT 25`, [], async function (err: Error, rows: any[]) {
        if (err) throw err; else {
            let stmt4 = db.prepare(`UPDATE guild_members
                                                SET cached_professions = ?
                                                WHERE character_name = ?
                                                AND realm = ?`);
            await Promise.all(rows.map(async (row) => {
                const options = {
                    "method": "GET",
                    "hostname": "us.api.blizzard.com",
                    "port": null,
                    "path": `/profile/wow/character/${row.realm}/${encodeURI(row.name.toLowerCase())}/professions?namespace=profile-us&locale=en_US&=`,
                    "headers": {
                        "Authorization": `Bearer ${blizztoken}`
                    }
                };
                await webreq(options).then((result) => {
                    // @ts-ignore
                    const data = JSON.parse(result)
                    console.log(options.path)
                    if (data.primaries) {
                        let stmt1 = db.prepare(`INSERT OR REPLACE INTO profession_skills 
                                                                (character_id, profession_id, profession_name, profession_tier_id, profession_tier_name, skill_level, max_skill_level, table_index)  
                                                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
                        let stmt2 = db.prepare(`INSERT OR REPLACE INTO character_known_recipes 
                                                                (character_id, recipe_id, table_index)  
                                                                VALUES (?, ?, ?)`);
                        let stmt3 = db.prepare(`INSERT OR REPLACE INTO profession_recipes 
                                                                (recipe_id, recipe_name, profession_id, profession_name, tier_id, tier_name)  
                                                                VALUES (?, ?, ?, ?, ?, ?)`);
                        data.primaries.forEach((item: any) => {
                            item.tiers.forEach((tier: any) => {
                                stmt1.run([data.character.id, item.profession.id, item.profession.name, tier.tier.id, tier.tier.name, tier.skill_points, tier.max_skill_points, Buffer.from(String(data.character.id) + String(item.profession.id) + String(tier.tier.id)).toString('base64')])
                                if (tier.known_recipes) {
                                    tier.known_recipes.forEach(async (recipe: any) => {
                                        stmt2.run([data.character.id, recipe.id, Buffer.from(String(data.character.id) + String(recipe.id)).toString('base64')]);
                                        stmt3.run([recipe.id, recipe.name, item.profession.id, item.profession.name, tier.tier.id, tier.tier.name]);

                                    });
                                }


                            })
                        })

                    }
                    stmt4.run([Date.now(), row.name, row.realm]);
                }).catch((err) => {
                    myLog(err)
                    myLog(options.path)
                    if (err === 404) {
                        stmt4.run([Date.now(), row.name, row.realm]);
                    }
                });

            }));

        }
        return true;
    })
}


async function updates() {
    myLog("Running updates...")
    await validateToken();
    await updateGuildRosters();

    await updateCharacterProfessions().catch(myLog);

    setTimeout(async () => {
        updates().catch(myLog);
    }, 1000 * 60 * 30); // 30 minutes
}
if (NODE_ENV !== 'development')
    updates().catch(myLog);



