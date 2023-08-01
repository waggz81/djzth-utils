import {EmbedPagination} from "../embedPagination";
import {client, myLog} from "../index";
import {Events} from "discord.js";

client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId.startsWith("nextEmbedPage") || interaction.customId.startsWith("previousEmbedPage")) {
        EmbedPagination(interaction).catch(myLog);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        myLog(error);
        await interaction.reply({
            content: 'There was an error while executing this command!' +
                '```' + error + '```', ephemeral: true
        });
    }
});
