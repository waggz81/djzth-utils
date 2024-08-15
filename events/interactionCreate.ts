import {EmbedPagination} from "../embedPagination";
import {client, myLog} from "../index";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events, GuildMember,
} from "discord.js";
import {
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
} from '@discordjs/voice';
import * as fs from "node:fs";
import {sendLFGPings} from "../helpers";

client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId.startsWith("nextEmbedPage") || interaction.customId.startsWith("previousEmbedPage")) {
        EmbedPagination(interaction).catch(myLog);
    }
    if (interaction.customId.startsWith("buzzerButton")) {
        const time = Math.floor(Date.now() / 1000);
        const delay = Number(interaction.customId.split(':-:')[1]);
        let panel = new EmbedBuilder()
            .setTitle("Buzzer Panel")
            .setDescription(`Buzzer pressed by <@${interaction.user.id}>`)
            .setFooter({text: `Buzzer will reset after ${delay} seconds`})
        let buzzButton = new ButtonBuilder()
            .setCustomId('buzz')
            .setLabel('Buzz!')
            .setCustomId('buzzerButton')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
        const correctButton = new ButtonBuilder()
            .setCustomId('correct')
            .setLabel('Correct')
            .setStyle(ButtonStyle.Success);
        const incorrectButton = new ButtonBuilder()
            .setCustomId('incorrect')
            .setLabel('Inorrect')
            .setStyle(ButtonStyle.Danger);
        let row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents([buzzButton, correctButton, incorrectButton]);
        interaction.message.edit({embeds: [panel], components: [row]});
        if (interaction.channel) {
            interaction.channel.send(`<@${interaction.user.id}> buzzed in <t:${time}:R>!`);
        }
        const connection = getVoiceConnection(interaction.guildId!);
        const player = createAudioPlayer();
        if (connection) {
            const subscription = connection.subscribe(player);
            const files = fs.readdirSync('./public/audio/buzzer');
            // const resource = createAudioResource(`./public/audio/buzzer/${files[Math.floor(Math.random()*files.length)] }`, { inlineVolume: true });
            const resource = createAudioResource(`./public/audio/buzzer/level-up-191997.mp3`, { inlineVolume: true });
            player.play(resource);
        }
        setTimeout(function() {
            panel = new EmbedBuilder()
                .setTitle("Buzzer Panel")
                .setDescription(`Buzzer ready!`)
            buzzButton = new ButtonBuilder()
                .setLabel('Buzz!')
                .setCustomId(`buzzerButton:-:${delay}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(false);
            row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(buzzButton);
            interaction.message.channel.send({embeds: [panel], components: [row]});
            interaction.message.delete();
            const resource = createAudioResource('./public/audio/buzzer/wrong/wrong-47985.mp3', {inlineVolume:true});
            resource.volume?.setVolume(0.6)
            player.play(resource);
        }, delay * 1000);
        interaction.deferUpdate();

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
        }).catch(myLog);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== "lfgping") return;
    if (interaction.message.channel && !interaction.message.channel.isThread()) return;

    interaction.deleteReply().catch(myLog);
    interaction.message.delete().catch(myLog);
    sendLFGPings(interaction.message.channel, false, interaction.values, interaction.member as GuildMember);
});
