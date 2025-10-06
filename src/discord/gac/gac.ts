import { Message, TextChannel, EmbedBuilder } from "discord.js";
import { logger } from "../logger";
import { IPlayer, Player, Stage, Team } from "@/lib/database/schema";

export type IGACImport = {
  teamName: string;
  guildId: string;
  email: string;
  userName: string;
  password: string;
  inGameName: string;
  uid: string;
};

export async function sendGACData(message: Message): Promise<void> {
  try {
    const teamName = (message.channel as TextChannel).name.replaceAll('-', ' ');
    const guildId = message.guild?.id;
    if(!guildId) return;
    
    const { stage, team } = await findTeamAndGuild(teamName, guildId);

    if (!team && !stage) {
      logger.error(`Team "${teamName}" not found.`);
      return;
    }
    const playerData: IPlayer[] = team.players;
    if (!playerData.length) {
      logger.error(`No GAC credentials found for team "${teamName}".`);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`GAC Credentials for ${teamName}`)
      .setColor("#2ecc71")
      .setFooter({ text: "Use responsibly. Do not share publicly." })
      .setTimestamp();

    playerData
      .sort((a, b) => a.uid.localeCompare(b.uid))
      .forEach((cred, index) => {
        embed.addFields({
          name: `#${index + 1} - ${cred.gacIngameName || cred.gacUsername}`,
          value: `**UID:** \`${cred.uid}\`\n**Username:** \`${cred.gacUsername}\`\n**Password:** \`${cred.gacPassword}\``,
          inline: false,
        });
      });

    await (message.channel as TextChannel).send({ embeds: [embed] });
    logger.info(`GAC Data sent successfully for team: ${teamName}`);
  } catch (error) {
    logger.error("Error sending GAC Data:", error);
  }
}

export async function importGacData(data: IGACImport[]): Promise<void> {
    for (const row of data) {
        try {
            const { stage, team } = await findTeamAndGuild(row.teamName, row.guildId);

            if (!team || !stage) {
                logger.warn(`Skipping ${row.userName} — Missing team or guild`);
                continue;
            }

            const existing = team.players.findOne({ gacUsername: row.userName });
            if (existing) {
                logger.warn(`Skipping ${row.userName} — Already exists`);
                continue;
            }

            await Player.updateMany(
              {uid: row.uid, team: team._id},
              {
                $set: {
                  email: row.email,
                  gacUsername: row.userName,
                  gacPassword: row.password,
                  gacIngameName: row.inGameName
                }
              }
            )

            logger.info(`Saved credentials for ${row.userName}`);
        } catch (error) {
            logger.error(`Error processing ${row.userName}:`, error);
        }
    }
}

async function findTeamAndGuild(teamName: string, guildId: string) {
      const stage = await Stage.findOne()
      .populate({
        path: 'guild',
        match: { guildId: guildId }
      });
    const team = await Team.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') }, stage: stage?._id
    }).populate('players');

    return { stage, team };
}