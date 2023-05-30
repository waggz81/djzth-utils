import {SlashCommandBuilder} from "@discordjs/builders";
import {getKeystones} from '../db'
import {CommandInteraction, InteractionReplyOptions, MessageActionRow, MessageButton, MessageEmbed} from "discord.js";
import {disableButtons, embedInteractions} from "../embedPagination";
import {KeystoneEntry, EmbedPages} from "../typings/types";
import {randomUUID} from "crypto";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("keystones")
        .setDescription("List known characters with keystones from community")
        .addIntegerOption((option) => option.setName("min").setDescription("Minimum keystone level to display").setRequired(false))
        .addIntegerOption((option) => option.setName("max").setDescription("Maximum keystone level to display").setRequired(false))
        .addStringOption((option) => option.setName("dungeon").setDescription("Filter to single dungeon").setRequired(false)
            .addChoice("Brackenhide Hollow", "Brackenhide Hollow")
            .addChoice("Freehold", "Freehold")
            .addChoice("Halls of Infusion", "Halls of Infusion")
            .addChoice("Neltharion's Lair", "Neltharion's Lair")
            .addChoice("Neltharus", "Neltharus")
            .addChoice("The Underrot", "The Underrot")
            .addChoice("The Vortex Pinnacle", "The Vortex Pinnacle")
            .addChoice("Uldaman: Legacy of Tyr", "Uldaman: Legacy of Tyr")
        ),
    async execute(interaction: CommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const min = interaction.options.getInteger('min');
        const max = interaction.options.getInteger('max');
        const dungeon = interaction.options.getString('dungeon');
        // console.log(min, max, dungeon)
        getKeystones(min, max, dungeon).then((rows) => {
            if (rows.length === 0) {
                interaction.editReply({
                    content: "_ _\n",
                    embeds: [new MessageEmbed()
                        .setTitle('Error')
                        .setDescription('No keystones uploaded for this week')
                        .setColor('#ff0000')
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
                    embed.setFooter(`Page ${i} of ${keystonePages.pages}`);
                    i++;
                }

                embedInteractions.push(keystonePages);
                console.log("pages", keystonePages);

                const row: MessageActionRow = new MessageActionRow();
                const replyOptions: InteractionReplyOptions = {
                    content: `_ _\n`,
                    ephemeral: true,
                    embeds: [keystonePages.embeds[0]],
                }
                if (keystonePages.pages > 1) {
                    row.addComponents(
                        new MessageButton()
                            .setCustomId(`previousEmbedPage:${keystonePages.uuid}:0`)
                            .setLabel('<')
                            .setStyle('PRIMARY')
                            .setDisabled(true)
                    );
                    row.addComponents(
                        new MessageButton()
                            .setCustomId(`nextEmbedPage:${keystonePages.uuid}:1`)
                            .setLabel('>')
                            .setStyle('PRIMARY')
                    );

                    replyOptions.components = [row];
                }


                interaction.editReply(replyOptions);
                disableButtons(interaction);
                // console.log(Table.print(rows))
            })


        })

    }
};

async function keystonePageEmbed(list: KeystoneEntry[]) {
    const keystonePages: EmbedPages = {
        pages: 1,
        uuid: randomUUID(),
        embeds: []
    };
    const fieldSize = 1000;

    const dungeonAbbr: any = {
        "Brackenhide Hollow": "BH",
        "Freehold": "FH",
        "Halls of Infusion": "HOI",
        "Neltharion's Lair": "NL",
        "Neltharus": "NELT",
        "The Underrot": "UNDR",
        "The Vortex Pinnacle": "VP",
        "Uldaman: Legacy of Tyr": "ULD"
    }

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
            (previousValue, currentValue) => `${previousValue}${dungeonAbbr[currentValue.dungeon_name]}\n`
            , "");

        if (nameField.length < fieldSize && dungeonField.length < fieldSize) {
            keystonePages.embeds[keystonePages.pages - 1] = new MessageEmbed()
                .setTitle('Keystones')
                .setFields([
                    {name: 'Name', value: nameField, inline: true},
                    {name: 'Level', value: levelField, inline: true},
                    {name: 'Dungeon', value: dungeonField, inline: true},
                ]);
            console.log(nameField)
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
        const embed = new MessageEmbed()
            .setTitle('Keystones')
            .setFields([
                {name: 'Name', value: nameField, inline: true},
                {name: 'Level', value: levelField, inline: true},
                {name: 'Dungeon', value: dungeonField, inline: true},
            ])
        keystonePages.embeds.push(embed as MessageEmbed);
    }

    return keystonePages;

}
