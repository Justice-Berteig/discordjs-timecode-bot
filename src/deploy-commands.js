// Import .env
require("dotenv").config();

// Node imports
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

// Require necessary discord.js classes
const { REST, Routes } = require("discord.js");

// Get info from .env
const clientID = process.env.CLIENT_ID;
const guildID = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

// Array to hold all our commands
const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
    try {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question("Register commands globally? (y/n): ", async (answer) => {
            console.log(answer);

            let data;
            if (answer === "y" || answer === "Y") {
                console.log(
                    `Started refreshing ${commands.length} application (/) commands globally.`
                );
                // The put method is used to fully refresh all commands globally with the current set
                data = await rest.put(Routes.applicationCommands(clientID), {
                    body: commands,
                });
            } else {
                console.log(
                    `Started refreshing ${commands.length} application (/) commands for guild ${guildID}.`
                );
                // The put method is used to fully refresh all commands in the guild with the current set
                data = await rest.put(
                    Routes.applicationGuildCommands(clientID, guildID),
                    {
                        body: commands,
                    }
                );
            }

            console.log(
                `Successfully reloaded ${data.length} application (/) commands.`
            );
            rl.close();
        });
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
