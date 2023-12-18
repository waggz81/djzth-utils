import {SlashCommandBuilder} from "@discordjs/builders";
import {getKeystones} from '../db'
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    CommandInteraction,
    EmbedBuilder,
    InteractionReplyOptions
} from "discord.js";
import {disableButtons, embedInteractions} from "../embedPagination";
import {EmbedPages, KeystoneEntry} from "../typings/types";
import {randomUUID} from "crypto";
import {myLog} from "../index";

const currentDungeons: string[][] = [
    ["Atal'Dazar", "AD"],
    ["Black Rook Hold", "BRH"],
    ["DotI: Galakrond's Fall", "FALL"],
    ["DotI: Murozond's Rise", "RISE"],
    ["Darkheart Thicket", "DHT"],
    ["The Everbloom", "EB"],
    ["Throne of the Tides", "TOTT"],
    ["Waycrest ManorWaycrest Manor", "WM"],
]
const choices: [name: string, value: string][] = [];
currentDungeons.forEach((entry) => {
    choices.push([entry[0],entry[0]])
})
module.exports = {
    data: new SlashCommandBuilder()
        .setName("keystones")
        .setDescription("List known characters with keystones from community")
        .addIntegerOption((option) => option.setName("min").setDescription("Minimum keystone level to display").setRequired(false))
        .addIntegerOption((option) => option.setName("max").setDescription("Maximum keystone level to display").setRequired(false))
        .addStringOption((option) => option.setName("dungeon").setDescription("Filter to single dungeon").setRequired(false)
            .addChoices(choices)
        ),
    async execute(interaction: CommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const min = interaction.options.get('min')?.value as number;
        const max = interaction.options.get('max')?.value as number;
        const dungeon = interaction.options.get('dungeon')?.value as string;
        getKeystones(min, max, dungeon).then((rows) => {
            if (rows.length === 0) {
                interaction.editReply({
                    content: "_ _\n",
                    embeds: [new EmbedBuilder({
                        title: 'Error',
                        description: 'No keystones uploaded for this week',
                        color: Colors.Red
                    })
                    ]
                })
                return;
            }

            const list: KeystoneEntry[] = [];
            for (const key of rows) {
                list.push(key)
            }

            list.sort((a, b) => (a.dungeon_name > b.dungeon_name) ? 1 : (a.dungeon_name === b.dungeon_name) ? ((a.key_level > b.key_level) ? 1 : -1) : -1);

            keystonePageEmbed(list).then(keystonePages => {
                let i = 1;
                for (const embed of keystonePages.embeds) {
                    embed.setFooter({ text:`Page ${i} of ${keystonePages.pages}`});
                    i++;
                }

                embedInteractions.push(keystonePages);

                const row = new ActionRowBuilder<ButtonBuilder>();
                const replyOptions: InteractionReplyOptions = {
                    content: `_ _\n`,
                    ephemeral: true,
                    embeds: [keystonePages.embeds[0]],
                }
                if (keystonePages.pages > 1) {
                    row.addComponents(
                        new ButtonBuilder({
                            label: '<',
                            style: ButtonStyle.Primary,
                            disabled: true,
                            customId: `previousEmbedPage:${keystonePages.uuid}:0`
                        })
                    );
                    row.addComponents(
                        new ButtonBuilder({
                            label: '>',
                            style: ButtonStyle.Primary,
                            customId: `nextEmbedPage:${keystonePages.uuid}:1`
                        })
                    );

                    replyOptions.components = [row];
                }
                interaction.editReply(replyOptions);
                disableButtons(interaction);
            })
        }).catch(console.log)
    }
};

async function keystonePageEmbed(list: KeystoneEntry[]) {
    const keystonePages: EmbedPages = {
        pages: 1,
        uuid: randomUUID(),
        embeds: []
    };
    const fieldSize = 1000;
    const dungeonAbbr: string[] = []
    currentDungeons.forEach((entry) => {
        // @ts-ignore
        dungeonAbbr[entry[0]] = entry[1];
    })

    let currentList: KeystoneEntry[] = [];
    let nameField: string = "";
    let levelField: string = "";
    let dungeonField: string = "";
    for (const entry of list) {
        currentList.push(entry);
        nameField = currentList.reduce(
            (previousValue, currentValue) => `${previousValue}[${currentValue.name}]` +
                        `(https://raider.io/characters/us/${currentValue.character.split('-')[1]}/` +
                        `${currentValue.character.split('-')[0]})\n`
            , "");
        levelField = currentList.reduce(
            (previousValue, currentValue) => `${previousValue}${currentValue.key_level}\n`
            , "");

        dungeonField = currentList.reduce(
            // @ts-ignore
            (previousValue, currentValue) => `${previousValue}${dungeonAbbr[currentValue.dungeon_name]}\n`
            , "");

        if (nameField.length < fieldSize && dungeonField.length < fieldSize) {
            keystonePages.embeds[keystonePages.pages - 1] = new EmbedBuilder({
                title:'Keystones'
            }).addFields(
                {name: 'Name', value: nameField, inline: true},
                {name: 'Level', value: levelField, inline: true},
                {name: 'Dungeon', value: dungeonField, inline: true},
            );
        } else {
            currentList = [entry];
            nameField = `[${entry.name}](https://raider.io/characters/us/${entry.character.split('-')[1]}/` +
                `${entry.character.split('-')[0]})`;
            levelField = entry.key_level.toString();
            dungeonField = entry.dungeon_name;
            keystonePages.pages = keystonePages.pages + 1;
        }
    }

    if (keystonePages.embeds.length !== keystonePages.pages) // we missed the last entry on a new page, add it
    {
        const embed = new EmbedBuilder({
            title: 'Keystones'
        }).addFields(
                {name: 'Name', value: nameField, inline: true},
                {name: 'Level', value: levelField, inline: true},
                {name: 'Dungeon', value: dungeonField, inline: true},
            );
        keystonePages.embeds.push(embed);
    }

    return keystonePages;

}
