import {SlashCommandBuilder} from "@discordjs/builders";
import {APIApplicationCommandOptionChoice, APIEmbedField, CommandInteraction, EmbedBuilder, Role} from "discord.js";
import {config} from "../config";
import {myLog} from "../index";
import * as https from "https";

const choices: APIApplicationCommandOptionChoice<string> | { name: string; value: string; }[] = [];
const teams: { team: string, gowID: string, gowAPIkey: string }[] = config.gowteams;

teams.forEach(team => {
    choices.push({name: team.team, value: team.gowID});
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName("teamaudit")
        .setDescription("Audit a raid team")
        .addStringOption((option) => option
            .setName("team")
            .setDescription("Select a team")
            .setRequired(true)
            .addChoices(choices)
        ),
    async execute(interaction: CommandInteraction) {
        // console.log(interaction);
        const teamID = teams.find(item => item.gowID === interaction.options.get('team')!.value!.toString());
        const embed = new EmbedBuilder({})
            .setTitle(teamID!.team)

        auditTeam(teamID!).then((result) => {
            // @ts-ignore
            const lastRefresh = Math.floor(Date.parse(result.lastAuditRefreshDate + 'Z') / 1000);
            let field1: string[] = [''];
            let field2: string[] = [''];
            let field3: string[] = [''];
            let field: number = 0;
            // @ts-ignore
            if (result.roster) {

                // @ts-ignore
                result.roster.forEach(member => {
                    if (member.audit) {
                        const auditWarnings = member.audit.gearAuditValidation ? Math.abs(member.audit.gearAuditValidation) : 0;
                        const warn = auditWarnings ? ` :warning: (${auditWarnings})` : '';
                        // @ts-ignore
                        const name = `[${member.name}${warn}](${result.baseUrl}${member.guildsOfWowUrl})\n`;
                        if (field1[field].length + name.length > 1023) {
                            field++;
                            field1[field] = '';
                            field2[field] = '';
                            field3[field] = '';
                        }
                        const gvMplusSlots = member.audit.mythicPlusGreatVaultRewards ? member.audit.mythicPlusGreatVaultRewards : 0;
                        const gvMplusSlot1 = member.audit.mythicPlusGreatVaultKeystone1 ? member.audit.mythicPlusGreatVaultKeystone1 : 0;
                        const gvMplusSlot2 = member.audit.mythicPlusGreatVaultKeystone2 ? member.audit.mythicPlusGreatVaultKeystone2 : 0;
                        const gvMplusSlot3 = member.audit.mythicPlusGreatVaultKeystone3 ? member.audit.mythicPlusGreatVaultKeystone3 : 0;
                        const gvRaidSlots = member.audit.raidGreatVaultRewards ? member.audit.raidGreatVaultRewards : 0;
                        const gvRaidSlot1 = member.audit.raidGreatVaultDifficulty1 ? member.audit.raidGreatVaultDifficulty1 : 0;
                        const gvRaidSlot2 = member.audit.raidGreatVaultDifficulty2 ? member.audit.raidGreatVaultDifficulty2 : 0;
                        const gvRaidSlot3 = member.audit.raidGreatVaultDifficulty3 ? member.audit.raidGreatVaultDifficulty3 : 0;
                        const tierPieces = member.audit.tierSetPieceCount ? member.audit.tierSetPieceCount : 0;
                        const weeklyScore = member.audit.weeklyScore ? member.audit.weeklyScore : 0;
                        const totalScore = member.audit.score ? member.audit.score : 0;
                        field1[field] += name;
                        field2[field] += `**${gvMplusSlots}** (_${gvMplusSlot1}_/_${gvMplusSlot2}_/_${gvMplusSlot3}_) / **${gvRaidSlots}** (_${gvRaidSlot1}_/_${gvRaidSlot2}_/_${gvRaidSlot3}_)\n`;
                        field3[field] += `**${tierPieces}**/5 - **${weeklyScore}** (_${totalScore}_)\n`;
                        //         console.log('field1', field1[field])
                    }
                    else {
                        // @ts-ignore
                        field1[field] += `[${member.name} :warning:](${result.baseUrl}${member.guildsOfWowUrl})\n`;
                        field2[field] += '**No Audit Information!**\n';
                        field3[field] += `\n`;
                    }
                });

                let fields: Array<APIEmbedField> = [];
                for (let i = 0; i <= field; i++) {
                    fields.push({name: 'Character', value: field1[i], inline: true})
                    fields.push({name: 'GV (M+ / Raid)', value: field2[i], inline: true})
                    fields.push({name: 'Tier Pieces & Score', value: field3[i], inline: true})
                }
                embed.addFields(fields);
            }


            //  console.log('field= ', field, 'fields = ', field1, field2, field3)
            embed.setDescription(`**Raid Team Audit**\n-# _Updated <t:${lastRefresh}:R>_`);
            // @ts-ignore
            embed.setURL(`${result.baseUrl}${result.guildPermaUrl}/team/${teamID.gowID}`);
            interaction.reply({ephemeral: false, embeds: [embed]});
        }).catch(err => {
            myLog(err);
            interaction.reply({ephemeral: true, content: err})
        });
    }
};

function auditTeam(teamID: { team: string, gowID: string, gowAPIkey: string }) {
    const customPromise = new Promise((resolve, reject) => {
        const options = new URL(`https://api.guildsofwow.com/roster/list?apiKey=${teamID.gowAPIkey}&team=${teamID.gowID}`);
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
