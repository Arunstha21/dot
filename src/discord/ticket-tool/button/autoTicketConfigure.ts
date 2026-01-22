import {ButtonInteraction } from "discord.js";
import { logger } from "../../logger";
import { configureTicketInternal } from "../utils/configure";

export async function autoConfigureTicket(interaction: ButtonInteraction) {
    logger.info('Auto configuring ticket system...');

    await configureTicketInternal(interaction);
}
