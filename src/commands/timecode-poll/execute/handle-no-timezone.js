// NODE imports
const { setTimeout } = require("node:timers/promises");

// Discord.js imports
const { EmbedBuilder, MessageFlags } = require("discord.js");

/*
Function outputs an error to console
and as a response to the initial interaction
*/
async function handleNoTimezone(interaction, timezoneName) {
    // Log error to the console
    console.error("ERROR: Could not find timezone with name: " + timezoneName);
    console.log();

    // Respond to interaction with an error
    await interaction.reply({
        content: "",
        components: [],
        embeds: [
            new EmbedBuilder()
                .setTitle(
                    'Sorry, we could not find the time zone: "' +
                        timezoneName +
                        '".'
                )
                .setDescription("Cancelling...")
                .setColor("#ff0000"),
        ],
        flags: MessageFlags.Ephemeral,
    });

    // Wait 10 seconds, then delete the reply
    setTimeout(10_000, interaction).then((interaction) => {
        interaction.deleteReply();
    });
}

module.exports = {
    handleNoTimezone: handleNoTimezone,
};
