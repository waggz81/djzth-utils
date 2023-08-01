import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CommandInteraction,
    ComponentType
} from "discord.js";
import {EmbedPages} from "./typings/types";

export async function EmbedPagination(interaction: ButtonInteraction) {
    const uuid = interaction.customId.split(':')[1];
    const targetPage = parseInt(interaction.customId.split(':')[2], 10);
    for (const entry of embedInteractions) {
        if (entry.uuid === uuid) {
            const prev = new ButtonBuilder({
                label: '<',
                style: ButtonStyle.Primary,
                disabled: (targetPage < 1),
                customId: `previousEmbedPage:${entry.uuid}:${targetPage - 1}`,
                type: ComponentType.Button
            });
            const next = new ButtonBuilder({
                label: '>',
                style: ButtonStyle.Primary,
                disabled: (targetPage >= entry.pages - 1),
                customId: `nextEmbedPage:${entry.uuid}:${targetPage + 1}`,
                type: ComponentType.Button
            })
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(prev,next);
            interaction.update({
                components: [row],
                embeds: [entry.embeds[targetPage]]
            }).catch(console.error)
        }
    }


}


export function disableButtons(interaction: CommandInteraction) {
    setTimeout(() => {
        interaction.editReply({
            components: []
        }).catch(console.error);
    }, 14 * 60 * 1000); // message can only be edited for 15 minutes, remove buttons after
}

const embedInteractions: EmbedPages[] = [];
export {embedInteractions};