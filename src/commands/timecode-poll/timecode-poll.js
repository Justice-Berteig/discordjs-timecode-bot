// NODE imports
const { setTimeout } = require("node:timers/promises");

// Third-party imports
const { getUnixTime } = require("date-fns");
const { TZDate } = require("@date-fns/tz");
const {
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
} = require("discord.js");

// Utility imports
const { getTimeZones, getTimeZoneByName } = require("./util/get-time-zones.js");

// Imports for execute functionality
const {
    createConfirmButton,
    createDaySelector,
    createFinalButtons,
    createTimeSelector,
} = require("./execute/components.js");
const { createInfoEmbed, createPromptEmbed } = require("./execute/embeds.js");
const { handleNoTimezone } = require("./execute/handle-no-timezone.js");
const { postPoll } = require("./execute/post-poll.js");

/*
Configure basic command properties
*/
const data = new SlashCommandBuilder()
    .setName("timecodepoll")
    .setDescription("Creates a poll using Discord's Unix timecodes.")
    .addStringOption((option) => {
        return option
            .setName("timezone")
            .setDescription("The time zone you are currently in.")
            .setAutocomplete(true)
            .setRequired(true);
    });
// .addIntegerOption((option) => {
//     return option
//         .setName("offset")
//         .setDescription(
//             "Number of hours offset from the selected timezone. (default 0)"
//         );
// })
// .addBooleanOption((option) => {
//     return option
//         .setName("use12hour")
//         .setDescription(
//             "Set to true if you don't like using 24-hour time. (default false)"
//         );
// });

/*
Define autocomplete functionality
*/
async function autocomplete(interaction) {
    // Get the command option that is focused right now
    const focusedOption = interaction.options.getFocused(true);
    // Initialize list of choices
    let choices;

    if (focusedOption.name === "timezone") {
        // If this is autocompleting for the "timezone" option

        // Get the incomplete value that needs to be autocompleted
        // and lowercase it
        const incomplete = focusedOption.value.toLowerCase();

        // Get list of all the time zones
        const timeZones = getTimeZones();
        // Filter for choices that start with the incomplete value entered by the user
        // and make sure there are no more than 25 options
        const filtered = timeZones
            .filter((timezone) =>
                timezone.abbreviation.toLowerCase().startsWith(incomplete)
            )
            .slice(0, 25);

        // Map each of the filtered time zones to a list of discordjs autocomplete
        // choices with a name and a value
        choices = filtered.map((timezone) => {
            // Create a name to display for this autocomplete option
            let name = timezone.abbreviation;
            if (timezone.isAmbiguous) {
                // If the abbreviation for this timezone
                // can represent multiple different time zones
                // Add the timezone name to the display name
                name += " (" + timezone.name + ")";
            }

            return {
                name: name,
                value: timezone.name,
            };
        });
    }

    // Respond with the autocomplete options
    await interaction.respond(choices);
}

/*
Define command functionality
Runs when the command is submitted
*/
async function execute(initialInteraction) {
    // Try to find matching timezone object using the timezone name
    const timeZoneName = initialInteraction.options.getString("timezone");
    const selectedTimeZone = getTimeZoneByName(timeZoneName);
    if (selectedTimeZone === null) {
        // If the selected timezone cannot be found
        handleNoTimezone(initialInteraction, timeZoneName);
        return;
    }

    // Initialize object to hold the data for the poll
    const pollData = {
        createdDate: new TZDate(Date.now(), selectedTimeZone.name),
        selectedDays: [],
        selectedTimeZone: selectedTimeZone,
    };

    // Display embeds with info and a select menu which days the user wants to poll
    const response = await initialInteraction.reply({
        components: [createDaySelector(pollData), createConfirmButton(true)],
        embeds: [createInfoEmbed(pollData), createPromptEmbed("days")],
        flags: MessageFlags.Ephemeral,
        withResponse: true,
    });

    // Create collector for this interaction
    const collector = response.resource.message.createMessageComponentCollector(
        { time: 600_000 }
    );

    collector.on("collect", async (collectedInteraction) => {
        // When the collector collects a new interaction
        collector.resetTimer();

        if (collectedInteraction.isStringSelectMenu()) {
            if (collectedInteraction.customId === "days") {
                // If this interaction is the result of the user selecting days

                // Collect the days and add to pollData
                pollData.selectedDays = collectedInteraction.values
                    .map((timestamp) => {
                        return Number(timestamp);
                    })
                    .sort((a, b) => {
                        return a - b;
                    })
                    .map((timestamp) => {
                        return {
                            date: new TZDate(
                                timestamp * 1000,
                                pollData.selectedTimeZone.name
                            ),
                        };
                    });

                // Update the original interaction to display the new selector
                collectedInteraction.update({
                    components: [
                        createDaySelector(pollData),
                        createConfirmButton(
                            pollData.selectedDays.length > 0 ? false : true
                        ),
                    ],
                    embeds: [
                        createInfoEmbed(pollData),
                        createPromptEmbed("days"),
                    ],
                });
            } else if (collectedInteraction.customId === "times") {
                for (let i = 0; i < pollData.selectedDays.length; i++) {
                    if (pollData.selectedDays[i].finished === undefined) {
                        // If this is the day that needs hours filled in

                        // Get list of the interaction's selected options,
                        // make sure they're numbers, and sort them from lowest to highest
                        // Values are the number of hours offset from midnight
                        // (eg. 0 would be 0:00, 2 would be 2:00, 15 would be 15:00, etc...)
                        pollData.selectedDays[i].selectedHours =
                            collectedInteraction.values
                                .map((timestamp) => {
                                    return Number(timestamp);
                                })
                                .sort((a, b) => {
                                    return a - b;
                                })
                                .map((timestamp) => {
                                    return new TZDate(
                                        timestamp * 1000,
                                        pollData.selectedTimeZone.name
                                    );
                                });

                        // Update the original interaction to display the new selector
                        collectedInteraction.update({
                            components: [
                                createTimeSelector(
                                    pollData.selectedDays[i],
                                    pollData.createdDate
                                ),
                                createConfirmButton(
                                    pollData.selectedDays[i].selectedHours
                                        .length > 0
                                        ? false
                                        : true
                                ),
                            ],
                            embeds: [
                                createInfoEmbed(pollData),
                                createPromptEmbed(
                                    "times",
                                    pollData.selectedDays[i].date
                                ),
                            ],
                        });
                        break;
                    }
                }
            }
        } else if (collectedInteraction.isButton()) {
            if (collectedInteraction.customId === "confirm-selection") {
                // If this interaction is the result of the user pressing the "Confirm Selection" button

                // Get the next selected day without any selected hours
                // And set the day that was just confirmed to finished
                let nextDay;
                for (const day of pollData.selectedDays) {
                    if (day.selectedHours === undefined) {
                        nextDay = day;
                        break;
                    } else if (day.selectedHours.length > 0 && !day.finished) {
                        day.finished = true;
                    }
                }

                if (nextDay) {
                    // If there is another day the user must select hours for
                    // Update the original interaction to display the new selector
                    collectedInteraction.update({
                        components: [
                            createTimeSelector(nextDay, pollData.createdDate),
                            createConfirmButton(true),
                        ],
                        embeds: [
                            createInfoEmbed(pollData),
                            createPromptEmbed("times", nextDay.date),
                        ],
                    });
                } else {
                    // If hours have been selected for all the days
                    // Update the original interaction to display the new selector
                    collectedInteraction.update({
                        components: [createFinalButtons()],
                        embeds: [
                            createInfoEmbed(pollData),
                            createPromptEmbed("post"),
                        ],
                    });
                }
            } else if (collectedInteraction.customId === "post-poll") {
                // If this interaction is the result of the user pressing the "Post Poll" button

                // Remove the initial interaction reply
                initialInteraction.deleteReply();

                // Post the poll
                postPoll(pollData, initialInteraction);

                collector.stop();
            } else if (collectedInteraction.customId === "cancel-poll") {
                // If this interaction is the result of the user pressing the "Cancel" button
              
                // Remove the initial interaction reply
                initialInteraction.deleteReply();

                collector.stop("cancel");
            }
        }
    });

    collector.on("end", async (collected, reason) => {
        // When the collector is stopped
        if (reason === "user") {
            // If the collector was stopped because the command is finished
            console.log("Poll finished successfully.");
            console.log();
        } else if(reason === "cancel") {
            // If the collector was stopped because the user cancelled
            console.log("User cancelled poll.");
            console.log();
        } else if (reason === "time") {
            // If the collector was stopped because time ran out
            console.log("Collector ran out of time.");
            console.log();

            // Display message to user that they ran out of time
            await initialInteraction.editReply({
                content: "",
                components: [],
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Went 10m without interaction.")
                        .setDescription("Cancelling...")
                        .setColor("#ff0000"),
                ],
            });

            // Wait 10 seconds, then delete the reply
            setTimeout(10_000, initialInteraction).then(
                (initialInteraction) => {
                    initialInteraction.deleteReply();
                }
            );
        } else {
            // If the collector was stopped for an unknown reason
            console.log('Collector stopped early for reason: "' + reason + '"');
            console.log();

            // Display error message to user
            await initialInteraction.editReply({
                content: "",
                components: [],
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Uh oh *_*")
                        .setDescription(
                            "Something has gone terribly wrong!\n" +
                                "Please let vaaritu know about this."
                        )
                        .setColor("#ff0000"),
                ],
            });

            // Wait 10 seconds, then delete the reply
            setTimeout(10_000, initialInteraction).then(
                (initialInteraction) => {
                    initialInteraction.deleteReply();
                }
            );
        }
    });
}

module.exports = {
    data: data,
    autocomplete: autocomplete,
    execute: execute,
};
