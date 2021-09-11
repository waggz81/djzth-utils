import {SlashCommandBuilder} from "@discordjs/builders";

import Table = require('easy-table')
import {getKeystones} from '../db'
import {MessageEmbed}  from "discord.js";


module.exports = {
    data: new SlashCommandBuilder()
        .setName("keystones")
        .setDescription("List known characters with keystones from community")
        .addIntegerOption((option) => option.setName("min").setDescription("Minimum keystone level to display").setRequired(false))
        .addIntegerOption((option) => option.setName("max").setDescription("Maximum keystone level to display").setRequired(false))
        .addStringOption( (option) => option.setName("dungeon").setDescription("Filter to single dungeon").setRequired(false)
            .addChoice("De Other Side", "De Other Side")
            .addChoice("Halls of Atonement", "Halls of Atonement")
            .addChoice("Mists of Tirna Scithe", "Mists of Tirna Scithe")
            .addChoice("Plaguefall", "Plaguefall")
            .addChoice("Sanguine Depths", "Sanguine Depths")
            .addChoice("Spires of Ascension", "Spires of Ascension")
            .addChoice("The Necrotic Wake", "The Necrotic Wake")
            .addChoice("Theater of Pain", "Theater of Pain")
        ),
    async execute(interaction) {
        const min = interaction.options.getInteger('min');
        const max = interaction.options.getInteger('max');
        const dungeon = interaction.options.getString('dungeon');
        // console.log(min, max, dungeon)
        getKeystones(min, max, dungeon).then((rows) => {
            const list = [];
            rows.forEach(row =>{
                list.push({
                    "Name": row.name,
                    "Level": row.key_level,
                    "Dungeon": row.dungeon_name
                })
            })
            list.sort((a, b) => (a.Dungeon > b.Dungeon) ? 1 : (a.Dungeon === b.Dungeon) ? ((a.Level > b.Level) ? 1 : -1) : -1 );
            // noinspection JSVoidFunctionReturnValueUsed,TypeScriptValidateJSTypes
            const content = "```" + Table.print(list) + "```";
            const embed = new MessageEmbed()
                .setTitle('Keystones')
                .setDescription(content)
            interaction.reply({content: `_ _\n`, ephemeral: true, embeds: [embed]});
            // console.log(Table.print(rows))
        })

    }
};
