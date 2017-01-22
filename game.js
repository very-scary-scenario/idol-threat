var KANA = [
  'a', 'i', 'u', 'e', 'o',
  'ka', 'ki', 'ku', 'ke', 'ko',
  'sa', 'shi', 'su', 'se', 'so',
  'ta', 'chi', 'tsu', 'te', 'to',
  'na', 'ni', 'nu', 'ne', 'no',
  'ha', 'hi', 'fu', 'he', 'ho',
  'ma', 'mi', 'mu', 'me', 'mo',
  'ya', 'yu', 'yo',
  'ra', 'ri', 'ru', 're', 'ro',
  'ga', 'gi', 'gu', 'ge', 'go',
  'za', 'ji', 'zu', 'ze', 'zo',
  'da', 'ji', 'zu', 'de', 'do',
  'ba', 'bi', 'bu', 'be', 'bo',
  'pa', 'pi', 'pu', 'pe', 'po',
  // 'kya', 'kyu', 'kyo',
  // 'sha', 'shu', 'sho',
  // 'cha', 'chu', 'cho',
  // 'nya', 'nyu', 'nyo',
  // 'hya', 'hyu', 'hyo',
  // 'mya', 'myu', 'myo',
  // 'rya', 'ryu', 'ryo',
  // 'gya', 'gyu', 'gyo',
  // 'bya', 'byu', 'byo',
  // 'pya', 'pyu', 'pyo'
  'ja', 'ju', 'jo'
];
var N = 'n';

var LAYERS = [
    'hbe',
    'hb',
    'bd',
    'cb',
    'ct',
    'hd',
    'hf',
    'hfe',
    'ah',
    'mt',
    'ns',
    'ey',
    'eb'
];

var barcodeImage = document.getElementById('barcode-image');
var detailElement = document.getElementById('idol-detail');
var spriteTemplate = Handlebars.compile(document.getElementById('sprite-template').innerHTML);
var catalogTemplate = Handlebars.compile(document.getElementById('catalog-template').innerHTML);
var unitTemplate = Handlebars.compile(document.getElementById('unit-template').innerHTML);
var idolDetailTemplate = Handlebars.compile(document.getElementById('idol-detail-template').innerHTML);

var maxUnitSize = 3;

function choice(list, slice) {
  var result = list[Math.floor(slice * list.length)];
  return result;
}

function seededRandom(seed) {
  function rand(max, min) {
    max = max || 1;
    min = min || 0;

    seed = (seed * 9301 + 49297) % 233280;
    var rnd = seed / 233280;

    return min + rnd * (max - min);
  }

  return rand;
}

function Ability(parts) {
  this.bonus = 0;
  this.healing = false;

  var partNames = [];

  for(var i = 0, n = parts.length; i < n; i++) {
    var part = parts[i];
    partNames.push(part.word);
    this.bonus += part.bonus;
    if (part.healing) {
      this.healing = true;
    }
  }

  this.name = partNames.join(' ');
}

function Idol(seed) {
  this.seed = seed;
  this.rand = seededRandom(seed);
  this.xp = 0;
  this.level = 0;

  this.endurance = Math.floor(this.rand(-100, 100));
  this.attack = Math.floor(this.rand(-100, 100));
  this.speed = Math.floor(this.rand(-100, 100));
  this.defense = Math.floor(this.rand(-100, 100));

  this.abilities = [];

  this.firstName = this.generateName();
  this.lastName = this.generateName();
  this.name = [this.firstName, this.lastName].join(' ');

  var partsMissing = true;
  while (partsMissing) {
    this.parts = [];
    partsMissing = false;
    var poseParts = PARTS[choice(Object.keys(PARTS), this.rand())];
    var skinColourParts = poseParts[choice(Object.keys(poseParts), this.rand())];
    var hairColourParts = skinColourParts[choice(Object.keys(skinColourParts), this.rand())];
    for(var i = 0, n = LAYERS.length; i < n; i++) {
      var options = hairColourParts[LAYERS[i]];
      if (options.length === 0) {
        partsMissing = true;
      }
      this.parts.push(choice(options, this.rand()));
    }
  }

  var bioParts = [];
  while(bioParts.length < 3) {
    var part = choice(BIOS, this.rand());
    if (bioParts.indexOf(part) === -1) {
      bioParts.push(part);
    }
  }
  this.bio = bioParts.join(' ');

  while (this.abilities.length < 4) {
    var abilityParts = [];

    if (this.rand() > 0.8)
      abilityParts.push(choice(ABILITIES[0], this.rand()));

    abilityParts.push(choice(ABILITIES[1], this.rand()));
    abilityParts.push(choice(ABILITIES[2], this.rand()));
    this.abilities.push(new Ability(abilityParts));
  }
}
Idol.prototype.generateName = function() {
  var name = '';
  var kanaCount = Math.floor(this.rand(4, 2));
  while (kanaCount > 0) {
    name += choice(KANA, this.rand());
    kanaCount--;
  }
  name = name[0].toUpperCase() + name.slice(1);
  if (this.rand() > 0.8) {
    name += N;
  }
  return name;
};
Idol.prototype.spriteHTML = function(thumb) {
  return spriteTemplate({
    parts: this.parts,
    thumb: thumb === true
  });
};
Idol.prototype.thumbSpriteHTML = function() {
  return this.spriteHTML(true);
};
Idol.prototype.isInUnit = function() {
  return agency.unit.indexOf(this) !== -1;
};
Idol.prototype.toggleUnitMembership = function() {
  if (this.isInUnit()) {
    agency.unit.splice(agency.unit.indexOf(this), 1);
  } else {
    agency.addToUnit(this, true);
  }
  rerender();
};
Idol.prototype.showDetail = function() {
  detailElement.innerHTML = idolDetailTemplate(this);
  detailElement.classList.add('shown');
	detailElement.querySelector('.close').addEventListener('click', hideIdolDetail);
};

function hideIdolDetail() {
  detailElement.classList.remove('shown');
}

function Agency() {
  this.catalog = [];
  this.unit = [];
}
Agency.prototype.renderCatalog = function() {
  document.getElementById('catalog').innerHTML = catalogTemplate(this);
  var agency = this;

  document.querySelectorAll('#catalog li .input').forEach(function(element, i) {
    element.addEventListener('click', function(e) {
      agency.catalog[i].toggleUnitMembership();
      e.stopPropagation();
      return false;
    });
  });

  document.querySelectorAll('#catalog li').forEach(function(element, i) {
    element.addEventListener('click', function(e) {
      agency.catalog[i].showDetail();
    });
  });
};
Agency.prototype.renderUnit = function() {
  document.getElementById('unit').innerHTML = unitTemplate(this);
};
Agency.prototype.addIdol = function(idol) {
  for(var i = 0, n = this.catalog.length; i < n; i++) {
    if (this.catalog[i].seed === idol.seed) {
      alert("You recruited this idol already; it's " + idol.name + "!");
      return;
    }
  }
  this.catalog.push(idol);
  this.addToUnit(idol);
  rerender();
};
Agency.prototype.addToUnit = function(idol, interactive) {
  if (this.unit.length >= maxUnitSize) {
    if (interactive !== undefined) {
      alert("Your unit is full; you'll need to remove someone before you can add " + idol.name + ".");
    }
  } else {
    this.unit.push(idol);
  }
};

function numFromString(str) {
  var total = 0;
  for(var i = 0, n = str.length; i < n; i++) {
      var c = str.charCodeAt(i);
      total += ((255 * Math.pow(2, i)) * c);
  }
  return total;
}

function addIdolFromImage(data) {
  if ((!data) || (!data.codeResult)) {
    alert("Sorry, we couldn't read a barcode in that picture, please try a clearer photo.");
    return;
  }
  idol = new Idol(numFromString(data.codeResult.code));
  agency.addIdol(idol);
}

barcodeImage.addEventListener('change', function(e) {
  Quagga.decodeSingle({
    src: window.URL.createObjectURL(barcodeImage.files[0]),
    decoder: {
      readers: [
        'code_128_reader',
        'ean_reader',
        'ean_8_reader',
        'code_39_reader',
        'code_39_vin_reader',
        'codabar_reader',
        'upc_reader',
        'upc_e_reader',
        'i2of5_reader'
      ]
    },
    debug: true
  }, addIdolFromImage);
});

var agency = new Agency();

function rerender() {
  agency.renderCatalog();
  agency.renderUnit();

  document.getElementById('recruit').addEventListener('click', function(e) {
    e.stopPropagation();
    barcodeImage.click();
    return false;
  });
}

/*
agency.catalog.push(new Idol(214321100));
agency.catalog.push(new Idol(29143112));
agency.catalog.push(new Idol(112341433));
agency.catalog.push(new Idol(2));
agency.catalog.push(new Idol(19));
agency.unit.push(agency.catalog[0]);
agency.unit.push(agency.catalog[2]);
agency.unit.push(agency.catalog[4]);
*/

rerender();
