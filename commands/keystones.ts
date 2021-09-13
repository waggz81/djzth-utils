import {SlashCommandBuilder} from "@discordjs/builders";
import {getKeystones} from '../db'
import {CommandInteraction, InteractionReplyOptions, MessageActionRow, MessageButton, MessageEmbed} from "discord.js";
import {disableButtons, keystoneInteractions} from "../keystonesPagination";
import {KeystonelistEntry, KeystonePages} from "../typings/types";
import {randomUUID} from "crypto";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("keystones")
        .setDescription("List known characters with keystones from community")
        .addIntegerOption((option) => option.setName("min").setDescription("Minimum keystone level to display").setRequired(false))
        .addIntegerOption((option) => option.setName("max").setDescription("Maximum keystone level to display").setRequired(false))
        .addStringOption((option) => option.setName("dungeon").setDescription("Filter to single dungeon").setRequired(false)
            .addChoice("De Other Side", "De Other Side")
            .addChoice("Halls of Atonement", "Halls of Atonement")
            .addChoice("Mists of Tirna Scithe", "Mists of Tirna Scithe")
            .addChoice("Plaguefall", "Plaguefall")
            .addChoice("Sanguine Depths", "Sanguine Depths")
            .addChoice("Spires of Ascension", "Spires of Ascension")
            .addChoice("The Necrotic Wake", "The Necrotic Wake")
            .addChoice("Theater of Pain", "Theater of Pain")
        ),
    async execute(interaction: CommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const min = interaction.options.getInteger('min');
        const max = interaction.options.getInteger('max');
        const dungeon = interaction.options.getString('dungeon');
        // console.log(min, max, dungeon)
        getKeystones(min, max, dungeon).then((rows) => {

            const list: KeystonelistEntry[] = [];
            for (const key of rows) {
                list.push({
                    "Name": key.name,
                    "Level": key.key_level,
                    "Dungeon": key.dungeon_name
                })
            }

            list.sort((a, b) => (a.Dungeon > b.Dungeon) ? 1 : (a.Dungeon === b.Dungeon) ? ((a.Level > b.Level) ? 1 : -1) : -1);

            keystonePageEmbed(list).then(keystonePages => {
                let i = 1;
                for (const embed of keystonePages.embeds) {
                    embed.setFooter(`Page ${i} of ${keystonePages.pages}`);
                    i++;
                }

                keystoneInteractions.push(keystonePages);
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
                            .setCustomId(`previousKeystonePage:${keystonePages.uuid}:0`)
                            .setLabel('<')
                            .setStyle('PRIMARY')
                            .setDisabled(true)
                    );
                    row.addComponents(
                        new MessageButton()
                            .setCustomId(`nextKeystonePage:${keystonePages.uuid}:1`)
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

async function keystonePageEmbed(list: KeystonelistEntry[]) {
    const keystonePages: KeystonePages = {
        pages: 1,
        uuid: randomUUID(),
        embeds: []
    };
    const fieldSize = 270;

    let currentList: KeystonelistEntry[] = [];
    let nameField: string = "";
    let levelField: string = "";
    let dungeonField: string = "";
    for (const entry of list) {
        currentList.push(entry)
        nameField = currentList.reduce(
            (previousValue, currentValue) => previousValue + currentValue.Name + "\n"
            , "");
        levelField = currentList.reduce(
            (previousValue, currentValue) => previousValue + currentValue.Level + "\n"
            , "");
        dungeonField = currentList.reduce(
            (previousValue, currentValue) => previousValue + currentValue.Dungeon + "\n"
            , "");

        if (nameField.length < fieldSize && dungeonField.length < fieldSize) {
            keystonePages.embeds[keystonePages.pages - 1] = new MessageEmbed()
                .setTitle('Keystones')
                .setFields([
                    {name: 'Name', value: nameField, inline: true},
                    {name: 'Level', value: levelField, inline: true},
                    {name: 'Dungeon', value: dungeonField, inline: true},
                ]);
        } else {
            currentList = [entry];
            nameField = entry.Name;
            levelField = entry.Level.toString();
            dungeonField = entry.Dungeon;
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
