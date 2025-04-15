// Node imports
const fs = require("node:fs");

/*
Function loads and returns a list of all
time zone objects from the time-zones.json file
*/
function getTimeZones() {
    var timeZones = JSON.parse(fs.readFileSync("time-zones.json", "utf8"));
    return timeZones;
}

/*
Function takes the name of a time zone and returns
a valid time zone object that matches the name.
If no match could be found return null.
*/
function getTimeZoneByName(timeZoneName) {
    // Make sure time zone name is lowercase for consistency
    timeZoneName = timeZoneName.toLowerCase();

    // Get list of valid time zones
    const timeZones = getTimeZones();

    // Try to find the selected time zone in the list of valid time zones
    let selectedTimeZone = null;
    for (const tz of timeZones) {
        if (tz.name.toLowerCase() === timeZoneName) {
            selectedTimeZone = tz;
            break;
        }
    }

    if (selectedTimeZone === null) {
        // If the supplied time zone name could not be found
        // User may have supplied time zone abbreviation instead of name
        // ('PST' or 'BST' instead of 'America/Los_Angeles' or 'Bangladesh Standard Time')
        // Try to find a time zone with a matching time zone abbreviation
        // Won't be as accurate but most of the time it should be fine
        // TODO: Better implementation for finding time zone when input is weird
        for (const tz of timeZones) {
            if (tz.abbreviation.toLowerCase() === timeZoneName) {
                selectedTimeZone = tz;
                break;
            }
        }
    }

    return selectedTimeZone;
}

module.exports = {
    getTimeZoneByName: getTimeZoneByName,
    getTimeZones: getTimeZones,
};
