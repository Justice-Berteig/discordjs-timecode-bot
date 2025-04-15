// Third-party imports
const { format, getUnixTime } = require("date-fns");

// Hard-coded list of strings for custom emojis
const reactions = [
    "<:botitu_1:1347326967376248904>", // Custom '1' emoji
    "<:botitu_2:1347326981007474739>", // Custom '2' emoji
    "<:botitu_3:1347326989819973673>", // Custom '3' emoji
    "<:botitu_4:1347326999877779527>", // Custom '4' emoji
    "<:botitu_5:1347327009969143932>", // Custom '5' emoji
    "<:botitu_6:1347327019079434322>", // Custom '6' emoji
    "<:botitu_7:1347327026943492107>", // Custom '7' emoji
    "<:botitu_8:1347327036200325203>", // Custom '8' emoji
    "<:botitu_9:1347327044672946266>", // Custom '9' emoji
    "<:botitu_10:1347327053086720010>", // Custom '10' emoji
    "<:botitu_11:1347327062163324979>", // Custom '11' emoji
    "<:botitu_12:1347327071046865107>", // Custom '12' emoji
    "<:botitu_13:1347327080328859799>", // Custom '13' emoji
    "<:botitu_14:1347327089883349032>", // Custom '14' emoji
    "<:botitu_15:1347327100515909763>", // Custom '15' emoji
    "<:botitu_16:1347327108380229765>", // Custom '16' emoji
    "<:botitu_17:1347327117003587584>", // Custom '17' emoji
    "<:botitu_18:1347327128340791476>", // Custom '18' emoji
    "<:botitu_19:1347327136498716754>", // Custom '19' emoji
    "<:botitu_20:1347327144593850399>", // Custom '20' emoji
    "<:botitu_21:1347327153255223388>", // Custom '21' emoji
    "<:botitu_22:1347327162436423680>", // Custom '22' emoji
    "<:botitu_23:1347327173228494900>", // Custom '23' emoji
    "<:botitu_24:1347327181801521224>", // Custom '24' emoji
];

/*
Function takes a list of selections for a timecode poll
and the original interaction that started the poll,
then posts the final poll in the original interaction's channel
*/
function postPoll(data, interaction) {
    // const numDays = data.selectedDays.length;
    // const numTimes = data.selectedDays
    //     .map((obj) => {
    //         return obj.selectedHours;
    //     })
    //     .flat().length;
    // const uniqueTimes = data.selectedDays
    //     .map((obj) => {
    //         return obj.selectedHours;
    //     })
    //     .flat()
    //     .filter((hour, index, array) => {
    //         return array.indexOf(hour) === index;
    //     })
    //     .sort((a, b) => {
    //         return a - b;
    //     });

    // // TODO:
    // // Compare number of unique times
    // // to the max number of unique times for a single day
    // // and decide whether or not to have shared reactions
    // // for certain times based off of that
    // console.log("Number of days:");
    // console.log(numDays);
    // console.log();
    // console.log("Number of times:");
    // console.log(numTimes);
    // console.log();
    // console.log("Unique Times:");
    // console.log(uniqueTimes);
    // console.log();

    // Send the polls in the channel that initial interaction was called from
    for (const day of data.selectedDays) {
        // Create header text with the day
        let text = "# " + format(day.date, "EEEE MMMM do',' yyyy") + ":\n";
        // Add each of the times to the text
        for (let i = 0; i < day.selectedHours.length; i++) {
            text +=
                reactions[i] +
                " <t:" +
                getUnixTime(day.selectedHours[i]) +
                ":F>\n";
        }

        interaction.channel
            .send(text)
            .then(function (message) {
                for (let i = 0; i < day.selectedHours.length; i++) {
                    message.react(reactions[i]);
                }
            })
            .catch(function () {
                //Something
            });
    }
}

module.exports = {
    postPoll: postPoll,
};
