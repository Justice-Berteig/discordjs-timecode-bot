const { Events } = require("discord.js");

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(msg) {
        // When there is a message
        if (msg.author.bot) {
            // If the message was sent by a bot early return
            return;
        }

        if (msg.content === "hello") {
            msg.reply("Hey!");
        }
    },
};
