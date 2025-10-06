import { EmbedBuilder } from 'discord.js';

export const createSimpleEmbed = (description: string, color: import('discord.js').ColorResolvable = '#00b0f4') =>
  new EmbedBuilder().setDescription(description).setColor(color);