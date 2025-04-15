const fs = require("fs");
const { getTimeZones } = require("@vvo/tzdb");

function loadTimeZones() {
    const tzdbTimeZones = getTimeZones();

    // Group time zones by abbreviation
    const groupedByAbbreviation = [];
    for (const tz of tzdbTimeZones) {
        const abbreviation = tz.abbreviation;

        const re = /^.*[0-9]$/;
        if (re.test(abbreviation)) {
            continue;
        }

        let foundGroupWithSameAbbreviation = false;
        for (const group of groupedByAbbreviation) {
            if (group[0].abbreviation === abbreviation) {
                foundGroupWithSameAbbreviation = true;
                group.push(tz);
                break;
            }
        }

        if (!foundGroupWithSameAbbreviation) {
            groupedByAbbreviation.push([tz]);
        }
    }

    // Clean up the timezone objects since we don't need much info
    const cleanedTimeZones = groupedByAbbreviation.flatMap((group) => {
        return group.map((tz) => {
            return {
                abbreviation: tz.abbreviation,
                isAmbiguous: group.length > 1 ? true : false,
                name: tz.name,
            };
        });
    });

    // Sort time zones alphabetically by abbreviation
    const sortedTimeZones = cleanedTimeZones.sort((a, b) => {
        if (a.abbreviation < b.abbreviation) {
            return -1;
        } else if (a.abbreviation > b.abbreviation) {
            return 1;
        }
        return 0;
    });

    // Convert to JSON and save to file
    const timeZonesJSON = JSON.stringify(sortedTimeZones);
    fs.writeFile("time-zones.json", timeZonesJSON, "utf8", (err) => {
        if (err) console.error(err);
        else console.log("Saved time zones to time-zones.json");
    });
}

module.exports = {
    loadTimeZones: loadTimeZones,
};
