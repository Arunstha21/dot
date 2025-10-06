
import {
  EmbedBuilder,
  GuildMember,
  ChatInputCommandInteraction,
  TextChannel,
  GuildMemberRoleManager,
  User,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { logger } from "../logger";
import { tickets } from "./helper/tickets";
import { sendEmail } from "./helper/email";
import { handleError } from "../ticket-tool/utils/errors";
import { IPlayer, IRoleManagerUser, Team } from "@/lib/database/schema";
import { Guild, IGuild } from "@/lib/database/guild";

export async function onJoin(member: GuildMember): Promise<void> {
  logger.info(`New member joined: ${member.user.username}`);
  const guildCheck = await checkGuild(member);
  if (!guildCheck || guildCheck.guildId !== member.guild.id) {
    tickets(member);
    return;
  }

  const userAuthorized = await checkUser(member);
  if (!userAuthorized) {
    tickets(member);
    return;
  }
  const roles = userAuthorized.role;
  for (const role of roles) {
    const serverRole = member.guild.roles.cache.find((r) => r.name === role);
    if (serverRole) {
      try {
        await (member.roles as GuildMemberRoleManager).add(serverRole);
        logger.info(`Role ${role} added to ${member.user.username}`);
      } catch (error) {
        logger.error(`Failed to add role ${role} to ${member.user.username}:`, error);
      }
    } else {
      logger.info(`Role ${role} not found in the guild`);
    }
  }
  userAuthorized.serverJoined = true;
  await userAuthorized.save();
  const team = await Team.findById(userAuthorized.player.team);
  if (team?.teamTag) {
    const userName = (member.user as User & { globalName?: string }).globalName || member.user.username;
    const name = `${team.teamTag} | ${userName}`;
    await member.setNickname(name).catch(console.error);
    logger.info(`Nickname set to ${name} for ${member.user.username}`);
  }
}

export async function email(interaction: ChatInputCommandInteraction): Promise<void> {
  const email = interaction.options.getString("email", true);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    await interaction.reply("Invalid email address");
    return;
  }

  let MessageEmbed;
  const guildData = await checkGuild(interaction);
  if (!guildData) {
    await interaction.reply("Guild not found");
    return;
  }

  const correctUser = guildData.users.find(user => email === user.email);

  if (!correctUser) {
    MessageEmbed = new EmbedBuilder()
      .setTitle("Verification Failed")
      .setDescription("Invalid E-Mail address provided or you have joined the wrong server. Please contact the Admin for further assistance.")
      .setColor("#FF0000");
  } else {
    if (correctUser.emailSent >= 3) {
      MessageEmbed = new EmbedBuilder()
        .setTitle("Verification Failed")
        .setDescription("You have exceeded the maximum number of attempts. Please contact the Admin for further assistance.")
        .setColor("#FF0000");

      logger.info(`${correctUser.email} Exceeded maximum number of attempts`);
      await interaction.reply({ embeds: [MessageEmbed] });
      return;
    }
    if (correctUser.serverJoined) {
      MessageEmbed = new EmbedBuilder()
        .setTitle("Verification Failed")
        .setDescription("This Email has already been verified. Please use your registered email.")
        .setColor("#FF0000");
      await interaction.reply({ embeds: [MessageEmbed] });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    correctUser.otp = otp;
    correctUser.emailSent += 1;
    correctUser.sender = interaction.user.username;
    await correctUser.save();
    await sendEmail(email, otp);

    MessageEmbed = new EmbedBuilder()
      .setTitle("Verification Under Process")
      .setDescription(`An OTP has been sent to your ${email}. Enter the OTP using the command /verify or resend OTP using /email`)
      .addFields({ name: "To submit OTP", value: "```/verify 123456```", inline: false })
      .addFields({ name: "To resend OTP", value: "```/email example@abc.com```", inline: false })
      .setColor("#BF40BF");
  }

  await interaction.reply({ embeds: [MessageEmbed] });
}

export async function verify(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    await interaction.deferReply();

    const otp = interaction.options.getNumber("otp", true);

    const guildData = await checkGuild(interaction);
    if (!guildData) {
      await interaction.reply("Guild not found");
      return;
    }
    const user = guildData.users.find(user => user.sender === interaction.user.username && user.otp === otp);

    if (!user) {
      const messageEmbed = new EmbedBuilder()
        .setTitle("Verification Failed")
        .setDescription("No OTP has been sent to you. Please use the command /email to get the OTP.")
        .setColor("#FF0000");

      await interaction.editReply({ embeds: [messageEmbed] });
      return;
    }

    let MessageEmbed;
    if (otp !== user.otp) {
      MessageEmbed = new EmbedBuilder()
        .setTitle("Verification Failed")
        .setDescription("Invalid OTP provided. Please try again.")
        .setColor("#FF0000");
    } else {
      const roles = user.role;
      for (const role of roles) {
        const serverRole = interaction.guild?.roles.cache.find(r => r.name === role);
        if (serverRole) {
          try {
            await (interaction.member?.roles as GuildMemberRoleManager).add(serverRole);
            logger.info(`Role ${role} added to ${interaction.member?.user.username}`);
          } catch (error) {
            logger.error(`Failed to add role ${role} to ${interaction.member?.user.username}:`, error);
          }
        } else {
          logger.info(`Role ${role} not found in the guild`);
        }
      }

      const team = await Team.findById(user.player.team);
      const userName = (interaction.member?.user as User & { globalName?: string }).globalName || interaction.member?.user.username;

      if (userName && userName.length !== 22) {
        const name = `${team?.teamTag || ''} | ${userName}`;
        await (interaction.member as GuildMember).setNickname(name).catch(err => {
          console.error("Failed to set nickname:", err);
        });
        logger.info(`Nickname set to ${name} for ${interaction.member?.user.username}`);
      }

      user.userName = interaction.user.tag;
      user.serverJoined = true;
      user.otp = undefined;
      await user.save();

      logger.info(`User ${user.userName} verified successfully`);

      MessageEmbed = new EmbedBuilder()
        .setTitle("Verification Successful")
        .setDescription("You have been successfully verified.")
        .setColor("#00FF00");
    }

    await interaction.editReply({ embeds: [MessageEmbed] });
    setTimeout(() => {
      if ((interaction.channel as TextChannel)?.delete) {
        (interaction.channel as TextChannel).delete().catch(console.error);
      }
    }, 2000);

  } catch (error) {
    console.error("Error during verification:", error);
  }
}
type PopulatedRoleManagerUser = Omit<IRoleManagerUser, "player"> & {
  player: IPlayer;
};

type PopulatedGuild = Omit<IGuild, "users" | "admins"> & {
  users: PopulatedRoleManagerUser[];
  admins: PopulatedRoleManagerUser[];
};

export async function checkGuild(member: GuildMember | ChatInputCommandInteraction): Promise<PopulatedGuild | false> {
  const guildId = member.guild?.id;
  const guildDB = await Guild.findOne({ guildId })
    .populate<{ users: PopulatedRoleManagerUser[] }>({
      path: "users",
      populate: { path: "player" },
    })
    .populate<{ admins: PopulatedRoleManagerUser[] }>({
      path: "admins",
      populate: { path: "player" },
    });

  return (guildDB as unknown as PopulatedGuild) || false;
}

export async function checkUser(
  member: GuildMember
): Promise<PopulatedRoleManagerUser | false> {
  const { username, id, globalName } = member.user as User & { globalName?: string };
  const guildData = await checkGuild(member);

  if (!guildData) return false;

  const users = guildData.users;

  const userRecord = users.find(
    (user) =>
      user.userName === username ||
      user.userName === id ||
      (globalName && user.userName === globalName)
  );

  return userRecord || false;
}



export async function close(interaction: ChatInputCommandInteraction): Promise<void> {
  const { username, id, globalName } = interaction.user as User & { globalName?: string };
  const guildData = await checkGuild(interaction);
  if (!guildData) return;
  const admins = guildData.admins;

  const admin = await admins.find((admin) => {
    return admin.userName === username || admin.userName === id || (globalName && admin.userName === globalName);
  });

  if (!admin) {
    await interaction.reply("You are not authorized to close the ticket");
    return;
  }

  const ticketCategory = interaction.guild?.channels.cache.find(
    (c) => c.type === 4 && c.name.toLowerCase() === "tickets"
  );

  const channel = interaction.channel as TextChannel;

  if (!channel?.name.startsWith("ticket-")) {
    await interaction.reply("This is not a ticket channel, You can't delete this channel");
    return;
  }

  if (!ticketCategory || channel.parentId !== ticketCategory.id) {
    await interaction.reply("This is not a ticket channel, You can't delete this channel");
    return;
  }

  await channel.delete();
  logger.info(`Ticket channel closed by ${interaction.user.username}`);
}

export async function activateRoleManager(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const memberPermissions = interaction.member?.permissions;
    if (
      !memberPermissions ||
      (typeof memberPermissions !== 'string' && !memberPermissions.has(PermissionFlagsBits.ManageGuild))
    ) {
      await interaction.reply({
        content: '❌ You do not have permission to activate the role manager.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const guildId = interaction.guild?.id;
    if (!guildId) {
      await interaction.reply({ content: 'Must be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const existingGuild = await Guild.findOne({ guildId });
    if (!existingGuild) {
      await interaction.reply({ content: 'Guild not found in the database. Please go to the setup page.', flags: MessageFlags.Ephemeral });
      return;
    }
    existingGuild.roleManager = true;
    await existingGuild.save();

    await interaction.reply({ content: 'Role manager activated successfully.' });
  } catch (error) {
    await handleError(interaction, error);
  }
}

export async function deactivateRoleManager(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const memberPermissions = interaction.member?.permissions;
    if (
      !memberPermissions ||
      (typeof memberPermissions !== 'string' && !memberPermissions.has(PermissionFlagsBits.ManageGuild))
    ) {
      await interaction.reply({
        content: '❌ You do not have permission to deactivate the role manager.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const guildId = interaction.guild?.id;
    if (!guildId) {
      await interaction.reply({ content: 'Must be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const existingGuild = await Guild.findOne({ guildId });
    if (!existingGuild) {
      await interaction.reply({ content: 'Guild not found in the database.', flags: MessageFlags.Ephemeral });
      return;
    }
    existingGuild.roleManager = false;
    await existingGuild.save();

    await interaction.reply({ content: 'Role manager deactivated successfully.' });
  } catch (error) {
    await handleError(interaction, error);
  }
}
