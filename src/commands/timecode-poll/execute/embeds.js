// Third-party imports
const { format } = require("date-fns");
const { EmbedBuilder } = require("discord.js");

/*
Function creates and returns a Discord Embed object
displaying some error
*/
function createErrorEmbed(type) {
    if (type === "time") {
        return new EmbedBuilder()
            .setTitle("Went 10m without interaction.")
            .setDescription("Cancelling...")
            .setColor("#ff0000");
    } else {
        return new EmbedBuilder()
            .setTitle("Uh oh *_*")
            .setDescription(
                "Something has gone terribly wrong!\n" +
                    "Please let vaaritu know about this."
            )
            .setColor("#ff0000");
    }
}

/*
Function takes an object containing various selections
from a timecode poll including:
    - The selected time zone
    - The selected days and times if there are any
Then creates and returns an embed to display that info.
*/
function createInfoEmbed(data) {
    // Create main text of the embed containing info about the selected time zone
    let title = "Creating poll using **" + data.selectedTimeZone.name + "**...";
    let description =
        "The final poll will display times based on the viewer's time zone.\n" +
        "Selected time zone is only used when selecting what times to poll.\n" +
        "\n" +
        "The current time in **" +
        data.selectedTimeZone.name +
        "** is **" +
        format(data.createdDate, "H':'mm") +
        "** on **" +
        format(data.createdDate, "EEEE MMMM do',' yyyy") +
        "**.\n";

    // Fill fields only once days have been selected
    let fields = [];
    if (data.selectedDays && data.selectedDays.length > 0) {
        // If the user has selected some days

        description += "\n**You have selected:**\n";

        // Add fields to display each of the selected days
        // and times for those days
        for (const day of data.selectedDays) {
            // For each day that was selected

            let dayString = format(day.date, "EEEE MMMM do',' yyyy");
            let timesString = "";
            if (day.selectedHours && day.selectedHours.length > 0) {
                // If there are some selected times
                timesString = day.selectedHours
                    .map((hour) => {
                        return "- " + format(hour, "H':00'");
                    })
                    .join("\n");
            } else {
                // If no times have been selected for this day yet
                timesString = "- No times selected yet...";
            }

            // Add a field to display this day
            fields.push({
                name: dayString,
                value: timesString,
            });
        }
    }

    // Create and return the embed
    const infoEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .addFields(fields);
    return infoEmbed;
}

/*
Function creates and returns a Discord Embed object
prompting the user for the next step in creating the poll
*/
function createPromptEmbed(type, date) {
    if (type === "days" && date === undefined) {
        return new EmbedBuilder()
            .setTitle("Select which days you would like to have as options:")
            .setColor("#3399ff");
    } else if (type === "times" && date !== undefined) {
        return new EmbedBuilder()
            .setTitle(
                "Select which times you would like to have as options on " +
                    format(date, "EEEE MMMM do',' yyyy") +
                    ":"
            )
            .setColor("#3399ff");
    } else if (type == "post" && date === undefined) {
        return new EmbedBuilder()
            .setTitle(
                "Create a message describing what will happen on the chosen date. Then post the poll."
            )
            .setColor("#3399ff");
    } else {
        console.error(
            "ERROR: createPromptEmbed() called with: (type: " +
                type +
                ", date: " +
                date +
                ")"
        );
    }
}

module.exports = {
    createErrorEmbed: createErrorEmbed,
    createInfoEmbed: createInfoEmbed,
    createPromptEmbed: createPromptEmbed,
};
