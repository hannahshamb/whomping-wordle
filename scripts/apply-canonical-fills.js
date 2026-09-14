'use strict';

/**
 * First-pass canon fills for character-overrides.json.
 * Only fills null, empty, or "Unknown" — preserves existing values and include:false.
 * Re-run after editing: node scripts/apply-canonical-fills.js && npm run build:characters
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OVERRIDES_PATH = path.join(DATA_DIR, 'character-overrides.json');

/** API / byName keys */
const CANONICAL_FILLS = {
  'Alastor Moody': { house: 'Unknown' },
  'Alicia Spinet': { hairColour: 'brown', ancestry: 'half-blood' },
  'Antonin Dolohov': { house: 'Unknown', ancestry: 'pure-blood' },
  Bane: { house: 'None' },
  'Bathilda Bagshot': { house: 'None' },
  'Blaise Zabini': { hairColour: 'black', ancestry: 'pure-blood' },
  'Bloody Baron': { hairColour: 'black', ancestry: 'pure-blood' },
  Bogrod: { house: 'None', ancestry: 'N/A' },
  Buckbeak: { hairColour: 'brown', house: 'None', ancestry: 'N/A' },
  'Cormac McLaggen': { hairColour: 'red', ancestry: 'pure-blood' },
  'Cornelius Fudge': { house: 'None', ancestry: 'pure-blood' },
  Crookshanks: { hairColour: 'ginger', house: 'None', ancestry: 'N/A' },
  'Dennis Creevey': { house: 'Gryffindor' },
  Dobby: { hairColour: 'N/A', house: 'None', ancestry: 'N/A' },
  'Dudley Dursley': { house: 'None' },
  Fang: { house: 'None', ancestry: 'N/A' },
  'Fat Friar': { hairColour: 'brown', ancestry: 'pure-blood' },
  'Fat Lady': { hairColour: 'red', house: 'Hufflepuff', ancestry: 'pure-blood' },
  Fawkes: { house: 'None', ancestry: 'N/A' },
  'Fenrir Greyback': { house: 'None', ancestry: 'N/A' },
  'Filius Flitwick': { hairColour: 'white', ancestry: 'half-blood' },
  Firenze: { house: 'None', ancestry: 'N/A' },
  'Fleur Delacour': { house: 'None', ancestry: 'pure-blood' },
  Fluffy: { hairColour: 'brown', house: 'None', ancestry: 'N/A' },
  'Frank Longbottom': { hairColour: 'brown', house: 'Gryffindor' },
  'Gabrielle Delacour': { house: 'None' },
  'Gellert Grindelwald': { house: 'None', ancestry: 'pure-blood' },
  'Gilderoy Lockhart': { house: 'Ravenclaw' },
  'Godric Gryffindor': { hairColour: 'red', house: 'Gryffindor', ancestry: 'pure-blood' },
  Grawp: { house: 'None', ancestry: 'N/A' },
  Griphook: { hairColour: 'black', house: 'None', ancestry: 'N/A' },
  Hedwig: { house: 'None', ancestry: 'N/A' },
  'Helga Hufflepuff': { hairColour: 'brown', house: 'Hufflepuff', ancestry: 'pure-blood' },
  'Hestia Jones': { house: 'Unknown', ancestry: 'pure-blood' },
  'Hugo Weasley': { house: 'Gryffindor' },
  'Igor Karkaroff': { house: 'None', ancestry: 'pure-blood' },
  'Justin Finch-Fletchley': { hairColour: 'blond' },
  'Katie Bell': { hairColour: 'brown', ancestry: 'pure-blood' },
  'Kendra Dumbledore': { house: 'Unknown' },
  'Kingsley Shacklebolt': { house: 'Unknown' },
  Kreacher: { house: 'None', ancestry: 'N/A' },
  'Lavender Brown': { hairColour: 'brown', ancestry: 'half-blood' },
  'Lee Jordan': { hairColour: 'black', ancestry: 'half-blood' },
  'Ludo Bagman': { house: 'Unknown', ancestry: 'pure-blood' },
  'Madam Hooch': { house: 'Unknown', ancestry: 'half-blood' },
  'Madam Malkin': { hairColour: 'grey', house: 'Unknown', ancestry: 'half-blood' },
  'Madam Pomfrey': { hairColour: 'brown', house: 'Hufflepuff', ancestry: 'half-blood' },
  'Madam Rosmerta': { hairColour: 'brown', house: 'None', ancestry: 'half-blood' },
  'Madame Maxime': { hairColour: 'brown', house: 'None', ancestry: 'half-blood' },
  'Marcus Flint': { hairColour: 'black', ancestry: 'pure-blood' },
  'Marge Dursley': { hairColour: 'brown', house: 'None' },
  'Marietta Edgecombe': { ancestry: 'pure-blood' },
  'Michael Corner': { hairColour: 'black', ancestry: 'half-blood' },
  'Millicent Bulstrode': { hairColour: 'brown', ancestry: 'pure-blood' },
  'Moaning Myrtle': { hairColour: 'brown' },
  'Mrs Diggory': { hairColour: 'brown', house: 'None', ancestry: 'pure-blood' },
  'Mrs Figg': { hairColour: 'grey', house: 'None' },
  'Mundungus Fletcher': { house: 'Unknown', ancestry: 'half-blood' },
  'Myrtle Warren': { hairColour: 'brown' },
  'Narcissa Malfoy': { house: 'Slytherin' },
  'Nearly Headless Nick': { hairColour: 'brown', ancestry: 'pure-blood' },
  'Newt Scamander': { ancestry: 'pure-blood' },
  'Nicolas Flamel': { hairColour: 'white', house: 'None', ancestry: 'pure-blood' },
  Norberta: { name: 'Norbert', gender: 'female', hairColour: 'green', house: 'None', ancestry: 'N/A' },
  'Nymphadora Tonks': { ancestry: 'half-blood' },
  'Oliver Wood': { hairColour: 'brown', house: 'Gryffindor', ancestry: 'half-blood' },
  'Padma Patil': { hairColour: 'black', ancestry: 'pure-blood' },
  'Pansy Parkinson': { hairColour: 'black', ancestry: 'pure-blood' },
  'Parvati Patil': { hairColour: 'black', ancestry: 'pure-blood' },
  Peeves: { hairColour: 'N/A', house: 'None', ancestry: 'N/A' },
  'Penelope Clearwater': { hairColour: 'brown', ancestry: 'half-blood' },
  'Percival Dumbledore': { hairColour: 'brown', house: 'Unknown', ancestry: 'pure-blood' },
  'Peter Pettigrew': { hairColour: 'brown', ancestry: 'pure-blood' },
  'Petunia Dursley': { house: 'None' },
  'Phineas Nigelus Black': { hairColour: 'black' },
  'Pius Thicknesse': { house: 'Unknown', ancestry: 'pure-blood' },
  'Pomona Sprout': { hairColour: 'grey', ancestry: 'pure-blood' },
  'Rita Skeeter': { house: 'Unknown', ancestry: 'half-blood' },
  'Romilda Vane': { ancestry: 'pure-blood' },
  'Rowena Ravenclaw': { hairColour: 'brown', house: 'Ravenclaw', ancestry: 'pure-blood' },
  'Rufus Scrimgeour': { house: 'Unknown', ancestry: 'pure-blood' },
  'Salazar Slytherin': { hairColour: 'black', house: 'Slytherin', ancestry: 'pure-blood' },
  Scabior: { hairColour: 'brown', ancestry: 'half-blood' },
  'Sir Cadogan': { hairColour: 'grey', house: 'Gryffindor', ancestry: 'pure-blood' },
  'Stanley Shunpike': { hairColour: 'brown', house: 'Unknown', ancestry: 'muggle-born' },
  'Susan Bones': { hairColour: 'red', ancestry: 'pure-blood' },
  'Sybill Trelawney': { hairColour: 'brown', house: 'Ravenclaw', ancestry: 'half-blood' },
  'Ted Lupin': {
    name: 'Teddy Lupin',
    gender: 'male',
    hairColour: 'blue',
    role: 'Student',
    house: 'Hufflepuff',
    ancestry: 'half-blood'
  },
  'Ted Tonks': { include: false },
  'The Grey Lady': { hairColour: 'blonde', house: 'Ravenclaw', ancestry: 'pure-blood' },
  'The Sorting Hat': { gender: 'N/A', hairColour: 'N/A', house: 'None', ancestry: 'N/A' },
  Tom: { hairColour: 'bald', house: 'None', ancestry: 'muggle' },
  'Tom Riddle': { house: 'Slytherin' },
  Trevor: { hairColour: 'green', house: 'None', ancestry: 'N/A' },
  Vaisey: { ancestry: 'pure-blood' },
  'Vernon Dursley': { hairColour: 'brown', house: 'None' },
  'Victoire Weasley': { house: 'Hufflepuff', ancestry: 'pure-blood' },
  'Victor Krum': { house: 'None', ancestry: 'pure-blood' },
  'Walden Macnair': { ancestry: 'pure-blood' },
  Winky: { hairColour: 'brown', house: 'None', ancestry: 'N/A' },
  'Xenophilius Lovegood': { ancestry: 'pure-blood' },
  'Zacharias Smith': { ancestry: 'pure-blood' },
  'Argus Filch': { house: 'None' },
  'Garrick Ollivander': { hairColour: 'white', house: 'Ravenclaw', ancestry: 'half-blood' }
};

function shouldFill(value) {
  return value === null || value === undefined || value === '' || value === 'Unknown';
}

function main() {
  const overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));
  if (!overrides.byName) {
    overrides.byName = {};
  }

  let filled = 0;
  for (const [name, fills] of Object.entries(CANONICAL_FILLS)) {
    if (!overrides.byName[name]) {
      overrides.byName[name] = {};
    }
    const entry = overrides.byName[name];
    if (entry.include === false) {
      continue;
    }
    for (const [key, value] of Object.entries(fills)) {
      if (key === '_needs') {
        continue;
      }
      if (shouldFill(entry[key])) {
        entry[key] = value;
        filled += 1;
      }
    }
  }

  fs.writeFileSync(OVERRIDES_PATH, `${JSON.stringify(overrides, null, 2)}\n`);
  process.stdout.write(`Applied ${filled} canonical field fills to character-overrides.json\n`);
}

main();
