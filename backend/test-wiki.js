const axios = require('axios');
const queries = [
    "Mathematics",
    "Scientific_calculator",
    "Water_bottle",
    "Paper",
    "Headphones",
    "Drafting_machine",
    "Laptop_cooler",
    "C_(programming_language)",
    "Backpack",
    "USB_flash_drive",
    "Thermodynamics",
    "Desk_lamp",
    "Computer_keyboard",
    "Graph_paper",
    "Mobile_device"
];

async function run() {
    for (let q of queries) {
        try {
            let res = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${q}`);
            let pages = res.data.query.pages;
            let pageId = Object.keys(pages)[0];
            if (pageId !== '-1' && pages[pageId].original) {
                console.log(`"${q}": "${pages[pageId].original.source}",`);
            } else {
                console.log(`"${q}": "NOT FOUND",`);
            }
        } catch (e) { console.log(e.message); }
    }
}
run();
