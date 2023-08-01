import {ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction} from "discord.js";
import {EmbedPages} from "./typings/types";
import {myLog} from "./index";

export async function EmbedPagination (interaction: ButtonInteraction) {
    const uuid = interaction.customId.split(':')[1];
    const targetPage = parseInt(interaction.customId.split(':')[2], 10);
    for (const entry of embedInteractions) {
        if (entry.uuid === uuid) {
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder({
                        customId: `previousEmbedPage:${entry.uuid}:${targetPage-1}`,
                        label: '<',
                        style: ButtonStyle.Primary,
                        disabled: (targetPage < 1)
                    })
                )
                .addComponents(
                    new ButtonBuilder({
                        customId: `nextEmbedPage:${entry.uuid}:${targetPage+1}`,
                        label: '>',
                        style: ButtonStyle.Primary,
                        disabled: (targetPage >= entry.pages - 1)
                    })
                );
            interaction.update({
                components: [row],
                embeds: [entry.embeds[targetPage]]
            }).catch(myLog)
        }
    }
}

export function disableButtons (interaction: CommandInteraction) {
    setTimeout(() => {
        interaction.editReply({
            components: []
        }).catch(myLog);
    }, 14 * 60 * 1000); // message can only be edited for 15 minutes, remove buttons after
}

const embedInteractions: EmbedPages[] = [];
export {embedInteractions};
