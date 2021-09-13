import {ButtonInteraction, CommandInteraction, MessageActionRow, MessageButton} from "discord.js";
import {KeystonePages} from "./typings/types";

export async function keystonesPagination (interaction: ButtonInteraction) {
    const uuid = interaction.customId.split(':')[1];
    const targetPage = parseInt(interaction.customId.split(':')[2], 10);
    for (const entry of keystoneInteractions) {
        if (entry.uuid === uuid) {
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(`previousKeystonePage:${entry.uuid}:${targetPage-1}`)
                        .setLabel('<')
                        .setStyle('PRIMARY')
                        .setDisabled((targetPage < 1))
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId(`nextKeystonePage:${entry.uuid}:${targetPage+1}`)
                        .setLabel('>')
                        .setStyle('PRIMARY')
                        .setDisabled((targetPage >= entry.pages - 1))
                );
            interaction.update({
                components: [row],
                embeds: [entry.embeds[targetPage]]
            }).catch(console.error)
        }
    }


}


export function disableButtons (interaction: CommandInteraction) {
    setTimeout(() => {
        interaction.editReply({
            components: []
        }).catch(console.error);
    }, 14 * 60 * 1000); // message can only be edited for 15 minutes, remove buttons after
}

const keystoneInteractions: KeystonePages[] = [];
export {keystoneInteractions};