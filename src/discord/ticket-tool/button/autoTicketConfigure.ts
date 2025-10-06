import {ButtonInteraction } from "discord.js";
import { configureTicketInternal } from "../utils/configure";

export async function autoConfigureTicket(interaction: ButtonInteraction) {
    console.log('Auto configuring ticket system...');
    
    await configureTicketInternal(interaction);
}
