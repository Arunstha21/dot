import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, TextChannel, PermissionFlagsBits, ButtonInteraction, ChannelSelectMenuInteraction } from "discord.js";
import { createOrUpdateTicketConfig, getTicketConfig } from "../services/ticketConfig";
import { createSimpleEmbed } from "../utils/response";
import { handleError } from "../utils/errors";

export async function configureTicketInternal(interaction: ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction, channel?: TextChannel, transcriptChannel?: TextChannel) {
  try {

    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command must be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const existingConfig = await getTicketConfig(interaction.guild.id);
    if (existingConfig) {
      await interaction.reply({
        content: 'Ticket system is already configured.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Manual setup (both channels supplied)
    if (channel && transcriptChannel && channel.id === transcriptChannel.id) {
      await interaction.reply({
        content: 'The ticket channel and transcript channel cannot be the same.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (channel && transcriptChannel) {
        if (
            channel.type !== ChannelType.GuildText ||
            transcriptChannel.type !== ChannelType.GuildText
        ) {
            await interaction.reply({
            content: 'Please select valid text channels.',
            flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (channel.id === transcriptChannel.id) {
            await interaction.reply({
            content: 'The ticket channel and transcript channel cannot be the same.',
            flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const config = await createOrUpdateTicketConfig(
            interaction.guild.id,
            channel.id,
            transcriptChannel.id
        );

        const embed = new EmbedBuilder()
            .setTitle('Ticket Tool')
            .setDescription(`To create a ticket use the Create Ticket button`)
            .setColor(0x00ff00);

        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        await (channel as TextChannel).send({ embeds: [embed], components: [row] });

        await interaction.reply({
            embeds: [
            createSimpleEmbed(
                `Ticket channel set to <#${config.ticketChannel}>\nTranscript channel set to <#${config.transcriptChannel}>`
            )
            ],
            flags: MessageFlags.Ephemeral,
        });

        return;
    } else if (channel && !transcriptChannel) {
        await interaction.reply({
            content: 'Please provide a transcript channel.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    } else if (!channel && transcriptChannel) {
        await interaction.reply({
            content: 'Please provide a ticket channel.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // Auto-create if not provided
    const ticketCategory =
      interaction.guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === 'tickets'
      ) ||
      (await interaction.guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
      }));
      

    const everyoneRole = interaction.guild.roles.everyone;
    const adminRole = interaction.guild.roles.cache.find(r => r.permissions.has('Administrator'));

    const createdTicketChannel = await interaction.guild.channels.create({
      name: 'tickets',
      type: ChannelType.GuildText,
      parent: ticketCategory.id,
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          allow: ['ViewChannel'],
          deny: ['SendMessages'],
        },
      ],
    });

    const createdTranscriptChannel = await interaction.guild.channels.create({
      name: 'transcripts',
      type: ChannelType.GuildText,
      parent: ticketCategory.id,
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          deny: ['ViewChannel'],
        },
        ...(adminRole
          ? [
              {
                id: adminRole.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                ],
              },
            ]
          : []),
      ],
    });

    await createOrUpdateTicketConfig(
      interaction.guild.id,
      createdTicketChannel.id,
      createdTranscriptChannel.id
    );

    const embed = new EmbedBuilder()
      .setTitle('Ticket Tool')
      .setDescription(`To create a ticket use the Create Ticket button`)
      .setColor(0x00ff00);

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Create Ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await (createdTicketChannel as TextChannel).send({ embeds: [embed], components: [row] });

    await interaction.reply({
      embeds: [
        createSimpleEmbed(
          `Ticket channel created: <#${createdTicketChannel.id}>\nTranscript channel created: <#${createdTranscriptChannel.id}>`
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    await handleError(interaction, error);
  }
}
