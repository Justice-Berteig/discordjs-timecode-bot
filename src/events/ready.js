const { Events } = require("discord.js");

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        // Display console message when bot is ready
        console.log();
        console.log(`Bot ready! Logged in as ${client.user.tag}`);
        console.log();
    },
};
