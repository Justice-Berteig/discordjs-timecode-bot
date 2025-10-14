// Third-party imports
const {
    addHours,
    addDays,
    format,
    getDayOfYear,
    getHours,
    getUnixTime,
    setHours,
    setMilliseconds,
    setMinutes,
    setSeconds,
} = require("date-fns");
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require("discord.js");

/*
Function creates and returns a discord.js Button object
prompting the user to confirm their selection.

Used for confirming selections in StringSelectMenus
*/
function createConfirmButton(isDisabled) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("confirm-selection")
            .setDisabled(isDisabled)
            .setLabel("Confirm Selection")
            .setStyle(ButtonStyle.Success)
    );
}

/*
Function creates and returns a discord.js StringSelectMenu object
where the options are a list of 25 consecutive days starting
with the date this poll was made.

The label for each option will be a formatted string representation of the date
The value will be the Unix timestamp for that date
*/
function createDaySelector(data) {
    // Create list of StringSelectMenuOptions
    const dayOptions = [];
    for (let daysOffset = 0; daysOffset < 25; daysOffset++) {
        // Skip today if it's too late to select any more times
        if (daysOffset === 0 && getHours(data.createdDate) > 22) {
            continue;
        }

        // Create the StringSelectMenuOption and add to list
        const date = addDays(data.createdDate, daysOffset);
        dayOptions.push(
            new StringSelectMenuOptionBuilder()
                .setDefault(
                    data.selectedDays
                        .map((day) => {
                            return getUnixTime(day.date);
                        })
                        .includes(getUnixTime(date))
                        ? true
                        : false
                )
                .setLabel(format(date, "EEEE MMMM do',' yyyy"))
                .setValue(getUnixTime(date).toString())
        );
    }

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("days")
            .setPlaceholder("Select at least one day...")
            .setMinValues(0)
            .setMaxValues(dayOptions.length)
            .addOptions(dayOptions)
    );
}

/*
Function creates and returns a discord.js ActionRow object
containing buttons to either post the poll or cancel it
*/
function createFinalButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("post-poll")
            .setLabel("Post Poll")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("cancel-poll")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Danger)

    );
}

/*
Function creates and returns a discord.js StringSelectMenu object
where the options are a list of every hour in a day.

Make sure there are no options for selecting a time that is in the past.

The label for each option will be a formatted string representation of the time
The value will be the Unix timestamp for that time
*/
function createTimeSelector(day, pollCreatedDate) {
    let hour = setHours(day.date, 0);
    if (
        getDayOfYear(day.date) === getDayOfYear(pollCreatedDate) &&
        getHours(pollCreatedDate) !== 0
    ) {
        // If the given date is the same day as when this poll was created
        // the earliest time should be at least an hour after
        hour = setHours(hour, getHours(pollCreatedDate) + 1);
    }
    hour = setMinutes(hour, 0);
    hour = setSeconds(hour, 0);
    hour = setMilliseconds(hour, 0);

    // Create list of select component options for every hour in the day
    // so that the user can select the times they want to be in the poll
    const options = [];
    while (getDayOfYear(hour) === getDayOfYear(day.date)) {
        // Create a select component option where
        // the label is a string representation of that hour
        // and the value the Unix timestamp for that time
        // then add it to the list of options
        const option = new StringSelectMenuOptionBuilder()
            .setLabel(format(hour, "H':'mm"))
            .setValue(getUnixTime(hour).toString());
        if (day.selectedHours && day.selectedHours.length > 0) {
            option.setDefault(
                day.selectedHours
                    .map((time) => {
                        return getUnixTime(time);
                    })
                    .includes(getUnixTime(hour))
                    ? true
                    : false
            );
        }
        options.push(option);

        // Add an hour to the date
        hour = addHours(hour, 1);
    }

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("times")
            .setPlaceholder("Select at least one time...")
            .setMinValues(0)
            .setMaxValues(Math.min(options.length, 20))
            .addOptions(options)
    );
}

module.exports = {
    createConfirmButton: createConfirmButton,
    createDaySelector: createDaySelector,
    createFinalButtons: createFinalButtons,
    createTimeSelector: createTimeSelector,
};
