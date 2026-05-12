// ==UserScript==
// @name         Genshin Wiki Tools
// @namespace    R
// @version      v1.1-wip
// @description  I did it again...
// @author       You
// @match        https://genshin-impact.fandom.com/wiki/*
// @match        https://paimon.moe/*
// @connect      raw.githubusercontent.com
// @icon         https://genshin.hoyoverse.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL  https://github.com/Refusings/randomdatago/raw/refs/heads/master/Genshin%20Wiki%20Tools.user.js
// @updateURL    https://github.com/Refusings/randomdatago/raw/refs/heads/master/Genshin%20Wiki%20Tools.user.js
// ==/UserScript==
const DATA_VALUE_NAME = "paimonmoe_account_data";
let DATA = null;

(function () {
    'use strict';
    if (window.location.href.includes("paimon.moe")) {
        setTimeout(() => {
            add_save_data_btn();
        }, 500);
    } else {
        get_data();
    }
})();

function fmt(name) {
    return name
        .split("_")
        .map(v => v.charAt(0).toUpperCase() + v.slice(1))
        .join(" ")
}

function add_save_data_btn() {
    let sidebar = document.querySelector("#sapper > div.sidebar > div.flex");
    let save_data_link = document.createElement("a");
    save_data_link.className = "w-full rounded-xl ease-in duration-150  svelte-1mm4ag5";
    let save_data_group = document.createElement("div");
    save_data_group.className = "group w-full py-3 flex items-center px-4 cursor-pointer transition-colors";

    let save_data_image_flex = document.createElement("div");
    save_data_image_flex.className = "h-8 w-8 flex justify-center mr-3 opacity-75 group-hover:opacity-100 ease-in duration-150 text-white";

    let save_data_icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let save_data_icon_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    save_data_icon_path.setAttribute("d", "M9,3L5,7H8V14H10V7H13M16,17V10H14V17H11L15,21L19,17H16Z");
    save_data_icon.appendChild(save_data_icon_path);

    save_data_icon.setAttribute("className", "mr-2 svelte-1mzwbk9");
    save_data_icon.setAttribute("style", "fill:currentColor;");
    save_data_icon.setAttribute("viewBox", "0 0 24 24");

    save_data_image_flex.appendChild(save_data_icon);

    let save_data_text = document.createElement("span");
    save_data_text.className = "font-body font-semibold flex-1 text-lg leading-none text-gray-500 group-hover:text-white ease-in duration-150 svelte-1mm4ag5";
    save_data_text.textContent = "Clone Data";

    save_data_group.appendChild(save_data_image_flex);
    save_data_group.appendChild(save_data_text);

    save_data_link.appendChild(save_data_group);
    save_data_link.onclick = clone_data;
    sidebar.appendChild(save_data_link);
}

function clone_data() {
    window.indexedDB.open("paimonmoe", 2).onsuccess = (event => {
        let transaction = event.target.result.transaction(["keyvaluepairs"]);
        let object_store = transaction.objectStore("keyvaluepairs");
        object_store.get("characters").onsuccess = (event2 => {
            GM_setValue(DATA_VALUE_NAME, event2.target.result);
        });
    });
}

function get_data() {
    let data_url = "https://raw.githubusercontent.com/Refusings/randomdatago/refs/heads/master/character_weapon_data.json";
    GM_xmlhttpRequest({
        method: "GET",
        url: data_url,
        onload: (ev) => {
            let data = JSON.parse(ev.responseText);
            DATA = data;
            run_main();
        }
    });
}

function run_main() {
    let nameCheck = window.location.pathname.split("/wiki/")[1].replaceAll("_", " ");
    if (CHARACTERS.includes(nameCheck)) {
        applyConstellation(nameCheck);
        let weaponData = DATA?.[nameCheck];
        if (weaponData) {
            applyWeaponLink(weaponData);
        }
        // applyNextCharacter(nameCheck);
        // let chrdt = GM_getValue("character_data") ?? {};
        // try {
        //     let base_vals = [...[...document.querySelectorAll(`#mw-content-text > div > table.wikitable.ascension-stats > tbody > tr`)].filter(v => v.children[0].innerText.startsWith("90/90"))[0].children].map(v => v.innerText.replaceAll(",", ""));
        //     chrdt[nameCheck] = {
        //         "base_hp": parseFloat(base_vals[1]),
        //         "base_atk": parseFloat(base_vals[2]),
        //         "base_def": parseFloat(base_vals[3])
        //     };
        //     GM_setValue("character_data", chrdt);
        //     console.log(chrdt);
        // } catch (e) {
        //     console.error(e);
        // }
    } else {
        let characterData = Object.entries(DATA).find(([_, v]) => v.link.includes(nameCheck));
        if (characterData) {
            applyCharacterLink(characterData[0]);
        }
    }
}

function applyNextCharacter(nameCheck) {
    let characterName = document.querySelector(`aside.portable-infobox.pi-theme-char > h2[data-source="name"]`);
    let next = CHARACTERS?.[CHARACTERS.indexOf(nameCheck) + 1] ?? "Aino";
    createLink(next, "Next: " + next, "aside.portable-infobox.pi-theme-char", 1, "_self");
}

function applyConstellation(nameCheck) {
    let saved_cons = GM_getValue(DATA_VALUE_NAME, {});
    let cons = {};
    for (let name of Object.keys(saved_cons)) {
        cons[fmt(name)] = (saved_cons[name]?.default ?? 0) + (saved_cons[name]?.wish ?? 0) + (saved_cons[name]?.manual ?? 0) - 1;
    }
    let characterName = document.querySelector(`aside.portable-infobox.pi-theme-char > h2[data-source="name"]`);
    if (cons[nameCheck] >= 0) {
        characterName.innerText += ` (C${cons[nameCheck]})`;
    } else {
        characterName.innerText += " (unowned)";
    }
}

function applyWeaponLink(weaponData) {
    createLink(randomChoice(weaponData.link), weaponData.name, "aside.portable-infobox.pi-theme-char", 3);
}

function applyCharacterLink(character) {
    createLink(character, character, ".mw-content-ltr.mw-parser-output aside.portable-infobox", 2);
}

function randomChoice(linkEndList) {
    return linkEndList[Math.floor(Math.random() * linkEndList.length)];
}

function createLink(linkEnd, text, selector, index, target="_blank") {
    let link = "https://genshin-impact.fandom.com/wiki/" + linkEnd.replaceAll(" ", "_");
    let characterLinkArea = document.createElement("a");
    characterLinkArea.href = link;
    characterLinkArea.target = target;
    characterLinkArea.innerText = text;
    let weaponArea = document.querySelector(selector);
    let secondaryTitleArea = document.createElement("h2");
    secondaryTitleArea.className = "pi-item pi-header pi-secondary-font pi-item-spacing pi-secondary-background";
    secondaryTitleArea["data-item-name"] = "secondary_title";
    secondaryTitleArea.appendChild(characterLinkArea);
    weaponArea.insertBefore(secondaryTitleArea, weaponArea.children[index]);
}

const CHARACTERS = [
    "Aino",
    "Albedo",
    "Alhaitham",
    "Aloy",
    "Amber",
    "Arataki Itto",
    "Arlecchino",
    "Baizhu",
    "Barbara",
    "Beidou",
    "Bennett",
    "Candace",
    "Charlotte",
    "Chasca",
    "Chevreuse",
    "Chiori",
    "Chongyun",
    "Citlali",
    "Clorinde",
    "Collei",
    "Columbina",
    "Cyno",
    "Dahlia",
    "Dehya",
    "Diluc",
    "Diona",
    "Dori",
    "Durin",
    "Emilie",
    "Escoffier",
    "Eula",
    "Faruzan",
    "Fischl",
    "Flins",
    "Freminet",
    "Furina",
    "Gaming",
    "Ganyu",
    "Gorou",
    "Hu Tao",
    "Iansan",
    "Ifa",
    "Illuga",
    "Ineffa",
    "Jahoda",
    "Jean",
    "Kachina",
    "Kaedehara Kazuha",
    "Kaeya",
    "Kamisato Ayaka",
    "Kamisato Ayato",
    "Kaveh",
    "Keqing",
    "Kinich",
    "Kirara",
    "Klee",
    "Kujou Sara",
    "Kuki Shinobu",
    "Lan Yan",
    "Lauma",
    "Layla",
    "Linnea",
    "Lisa",
    "Lynette",
    "Lyney",
    "Mavuika",
    "Mika",
    "Mona",
    "Mualani",
    "Nahida",
    "Navia",
    "Nefer",
    "Neuvillette",
    "Nilou",
    "Ningguang",
    "Noelle",
    "Ororon",
    "Qiqi",
    "Raiden Shogun",
    "Razor",
    "Rosaria",
    "Sangonomiya Kokomi",
    "Sayu",
    "Sethos",
    "Shenhe",
    "Shikanoin Heizou",
    "Sigewinne",
    "Skirk",
    "Sucrose",
    "Tartaglia",
    "Thoma",
    "Tighnari",
    "Traveler",
    "Varesa",
    "Varka",
    "Venti",
    "Wanderer",
    "Wonderland Manekin",
    "Wriothesley",
    "Xiangling",
    "Xianyun",
    "Xiao",
    "Xilonen",
    "Xingqiu",
    "Xinyan",
    "Yae Miko",
    "Yanfei",
    "Yaoyao",
    "Yelan",
    "Yoimiya",
    "Yumemizuki Mizuki",
    "Yun Jin",
    "Zhongli",
    "Zibai"
];

const WEAPONS = [
    "A Thousand Blazing Suns",
    "A Thousand Floating Dreams",
    "Absolution",
    "Amos%27 Bow",
    "Aqua Simulacra",
    "Aquila Favonia",
    "Astral Vulture%27s Crimson Plumage",
    "Athame Artis",
    "Azurelight",
    "Beacon of the Reed Sea",
    "Bloodsoaked Ruins",
    "Calamity Queller",
    "Cashflow Supervision",
    "Crane%27s Echoing Call",
    "Crimson Moon%27s Semblance",
    "Elegy for the End",
    "Engulfing Lightning",
    "Everlasting Moonglow",
    "Fang of the Mountain King",
    "Fractured Halo",
    "Freedom-Sworn",
    "Gest of the Mighty Wolf",
    "Golden Frostbound Oath",
    "Haran Geppaku Futsu",
    "Hunter%27s Path",
    "Jadefall%27s Splendor",
    "Kagura%27s Verity",
    "Key of Khaj-Nisut",
    "Light of Foliar Incision",
    "Lightbearing Moonshard",
    "Lost Prayer to the Sacred Winds",
    "Lumidouce Elegy",
    "Memory of Dust",
    "Mistsplitter Reforged",
    "Nightweaver%27s Looking Glass",
    "Nocturne%27s Curtain Call",
    "Peak Patrol Song",
    "Polar Star",
    "Primordial Jade Cutter",
    "Primordial Jade Winged-Spear",
    "Redhorn Stonethresher",
    "Reliquary of Truth",
    "Silvershower Heartstrings",
    "Skyward Atlas",
    "Skyward Blade",
    "Skyward Harp",
    "Skyward Pride",
    "Skyward Spine",
    "Song of Broken Pines",
    "Splendor of Tranquil Waters",
    "Staff of Homa",
    "Staff of the Scarlet Sands",
    "Starcaller%27s Watch",
    "Summit Shaper",
    "Sunny Morning Sleep-In",
    "Surf%27s Up",
    "Symphonist of Scents",
    "The Daybreak Chronicles",
    "The First Great Magic",
    "The Unforged",
    "Thundering Pulse",
    "Tome of the Eternal Flow",
    "Tulaytullah%27s Remembrance",
    "Uraku Misugiri",
    "Verdict",
    "Vivid Notions",
    "Vortex Vanquisher",
    "Wolf%27s Gravestone",
    "%22The Catch%22",
    "%22Ultimate Overlord%27s Mega Magic Sword%22",
    "Akuoumaru",
    "Alley Hunter",
    "Amenoma Kageuchi",
    "Ash-Graven Drinking Horn",
    "Ballad of the Boundless Blue",
    "Ballad of the Fjords",
    "Blackcliff Agate",
    "Blackcliff Longsword",
    "Blackcliff Pole",
    "Blackcliff Slasher",
    "Blackcliff Warbow",
    "Blackmarrow Lantern",
    "Calamity of Eshu",
    "Chain Breaker",
    "Cinnabar Spindle",
    "Cloudforged",
    "Compound Bow",
    "Crescent Pike",
    "Dawning Frost",
    "Deathmatch",
    "Dialogues of the Desert Sages",
    "Dodoco Tales",
    "Dragon%27s Bane",
    "Dragonspine Spear",
    "Earth Shaker",
    "End of the Line",
    "Etherlight Spindlelute",
    "Eye of Perception",
    "Fading Twilight",
    "Favonius Codex",
    "Favonius Greatsword",
    "Favonius Lance",
    "Favonius Sword",
    "Favonius Warbow",
    "Festering Desire",
    "Finale of the Deep",
    "Flame-Forged Insight",
    "Fleuve Cendre Ferryman",
    "Flower-Wreathed Feathers",
    "Flowing Purity",
    "Flute of Ezpitzal",
    "Footprint of the Rainbow",
    "Forest Regalia",
    "Frostbearer",
    "Fruit of Fulfillment",
    "Fruitful Hook",
    "Hakushin Ring",
    "Hamayumi",
    "Ibis Piercer",
    "Iron Sting",
    "Kagotsurube Isshin",
    "Katsuragikiri Nagamasa",
    "King%27s Squire",
    "Kitain Cross Spear",
    "Lion%27s Roar",
    "Lithic Blade",
    "Lithic Spear",
    "Luxurious Sea-Lord",
    "Mailed Flower",
    "Makhaira Aquamarine",
    "Mappa Mare",
    "Master Key",
    "Missive Windspear",
    "Mitternachts Waltz",
    "Moonpiercer",
    "Moonweaver%27s Dawn",
    "Mountain-Bracing Bolt",
    "Mouun%27s Moon",
    "Oathsworn Eye",
    "Portable Power Saw",
    "Predator",
    "Prospector%27s Drill",
    "Prospector%27s Shovel",
    "Prototype Amber",
    "Prototype Archaic",
    "Prototype Crescent",
    "Prototype Rancour",
    "Prototype Starglitter",
    "Rainbow Serpent%27s Rain Bow",
    "Rainslasher",
    "Range Gauge",
    "Rightful Reward",
    "Ring of Yaxche",
    "Royal Bow",
    "Royal Greatsword",
    "Royal Grimoire",
    "Royal Longsword",
    "Royal Spear",
    "Rust",
    "Sacrificer%27s Staff",
    "Sacrificial Bow",
    "Sacrificial Fragments",
    "Sacrificial Greatsword",
    "Sacrificial Jade",
    "Sacrificial Sword",
    "Sapwood Blade",
    "Scion of the Blazing Sun",
    "Sequence of Solitude",
    "Serenity%27s Call",
    "Serpent Spine",
    "Snare Hook",
    "Snow-Tombed Starsilver",
    "Solar Pearl",
    "Song of Stillness",
    "Sturdy Bone",
    "Sword of Descension",
    "Sword of Narzissenkreuz",
    "Talking Stick",
    "Tamayuratei no Ohanashi",
    "The Alley Flash",
    "The Bell",
    "The Black Sword",
    "The Dockhand%27s Assistant",
    "The Flute",
    "The Stringless",
    "The Viridescent Hunt",
    "The Widsith",
    "Tidal Shadow",
    "Toukabou Shigure",
    "Wandering Evenstar",
    "Wavebreaker%27s Fin",
    "Waveriding Whirl",
    "Whiteblind",
    "Windblume Ode",
    "Wine and Song",
    "Wolf-Fang",
    "Xiphos%27 Moonlight",
    "Black Tassel",
    "Bloodtainted Greatsword",
    "Cool Steel",
    "Dark Iron Sword",
    "Debate Club",
    "Emerald Orb",
    "Ferrous Shadow",
    "Fillet Blade",
    "Halberd",
    "Harbinger of Dawn",
    "Magic Guide",
    "Messenger",
    "Otherworldly Story",
    "Raven Bow",
    "Recurve Bow",
    "Sharpshooter%27s Oath",
    "Skyrider Greatsword",
    "Skyrider Sword",
    "Slingshot",
    "Thrilling Tales of Dragon Slayers",
    "Traveler%27s Handy Sword",
    "Twin Nephrite",
    "White Iron Greatsword",
    "White Tassel",
    "Iron Point",
    "Old Merc%27s Pal",
    "Pocket Grimoire",
    "Seasoned Hunter%27s Bow",
    "Silver Sword",
    "Apprentice%27s Notes",
    "Beginner%27s Protector",
    "Dull Blade",
    "Hunter%27s Bow",
    "Waster Greatsword"
];
