const { Events, MessageFlags } = require("discord.js");

async function handleChatInputCommand(interaction) {
    // Attempt to get the command that was called
    const command = interaction.client.commands.get(interaction.commandName);

    // If the command could not be found
    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        );
        return;
    }

    // If the command was found
    try {
        // Try to execute it
        await command.execute(interaction);
    } catch (error) {
        // If there was a problem executing the command
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "There was an error while executing this command!",
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: "There was an error while executing this command!",
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}

async function handleAutocompleteCommand(interaction) {
    // Try to get the command that was called
    const command = interaction.client.commands.get(interaction.commandName);

    // If the command could not be found
    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        );
        return;
    }

    // If the command was found
    try {
        // Get the autocomplete options for that command
        await command.autocomplete(interaction);
    } catch (error) {
        // If there was a problem executing the command
        console.error(error);
    }
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            handleChatInputCommand(interaction);
        } else if (interaction.isAutocomplete()) {
            handleAutocompleteCommand(interaction);
        } else {
            // console.log("Unknown interaction type:");
            // console.log(interaction);
        }
    },
};
