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
var STATS = [
  'endurance',
  'attack',
  'speed',
  'defense'
];

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

var cookieExpiryDate = new Date();
cookieExpiryDate.setFullYear(cookieExpiryDate.getFullYear() + 50);
var cookieSuffix = '; expires=' + cookieExpiryDate.toUTCString();

function getStateCookie() {
  var cookieStrings = document.cookie.split(';');
  for(var i = 0, n = cookieStrings.length; i < n; i++) {
    var matches = cookieStrings[i].match(/(?:state=)(.*)/);
    if (!matches) {
      continue;
    }
    var stateString = matches[1];
    if (!!stateString) {
      return stateString;
    }
  }
}

var barcodeImage = document.getElementById('barcode-image');
var detailElement = document.getElementById('idol-detail');
var battleElement = document.getElementById('battle');
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

function Ability(parts, animation) {
  this.strength = 0;
  this.healing = false;

  var partNames = [];

  for(var i = 0, n = parts.length; i < n; i++) {
    var part = parts[i];
    partNames.push(part.word);
    this.strength += part.bonus;
    if (part.healing) {
      this.healing = true;
    }
  }

  this.name = partNames.join(' ');

  this.animation = animation;
}

function Idol(seed) {
  this.seed = seed;
  this.rand = seededRandom(seed);
  this.xp = 0;
  this.level = 0;

  for(var i = 0, n = STATS.length; i < n; i++) {
    this[STATS[i]] = Math.floor(this.rand(-100, 100));
  }

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
    for(var li = 0, ln = LAYERS.length; li < ln; li++) {
      var options = hairColourParts[LAYERS[li]];
      if (options.length === 0) {
        partsMissing = true;
      }
      this.parts.push(PART_INDEX[choice(options, this.rand())]);
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

  this.quote = choice(QUOTES, this.rand());

  while (this.abilities.length < 4) {
    var abilityParts = [];

    if (this.rand() > 0.8)
      abilityParts.push(choice(ABILITIES[0], this.rand()));

    abilityParts.push(choice(ABILITIES[1], this.rand()));
    abilityParts.push(choice(ABILITIES[2], this.rand()));
    this.abilities.push(new Ability(abilityParts, choice(ANIMATIONS, this.rand())));
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
  agency.addToUnit(this);
  rerender();
};
Idol.prototype.showDetail = function() {
  detailElement.innerHTML = idolDetailTemplate(this);
  detailElement.classList.add('shown');
	detailElement.querySelector('.close').addEventListener('click', hideIdolDetail);
};
Idol.prototype.dump = function() {
  var idolDump = {
    i: this.seed,
    s: []
  };
  for(var i = 0, n = STATS.length; i < n; i++) {
    idolDump.s.push(this[STATS[i]]);
  }
  return idolDump;
};

function hideIdolDetail(event) {
  event.stopPropagation();
  event.preventDefault();
  detailElement.classList.remove('shown');
}

function Agency() {
  this.catalog = [];
  this.unit = [];
}
Agency.prototype.renderCatalog = function() {
  document.getElementById('catalog').innerHTML = catalogTemplate(this);
  var agency = this;

  inputs = document.querySelectorAll('#catalog li .input');

  function toggleMembership(event) {
    event.stopPropagation();
    event.preventDefault();
    i = parseInt(event.currentTarget.getAttribute('data-index'), 10);
    agency.catalog[i].toggleUnitMembership();
  }

  for (var i = 0, n = inputs.length; i < n; i++) {
    var element = inputs[i];
    element.addEventListener('click', toggleMembership);
  }

  var lis = document.querySelectorAll('#catalog li');

  function showDetail(event) {
    event.stopPropagation();
    event.preventDefault();
    i = parseInt(event.currentTarget.getAttribute('data-index'), 10);
    agency.catalog[i].showDetail();
  }

  for (var j = 0, m = lis.length; j < m; j++) {
    var li = lis[j];
    li.addEventListener('click', showDetail);
  }
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
  this.unit = [idol];
};
Agency.prototype.dump = function() {
  var agencyDump = {i: []};

  for(var i = 0, n = this.catalog.length; i < n; i++) {
    agencyDump.i.push(this.catalog[i].dump());
  }

  return agencyDump;
};
Agency.prototype.load = function(agencyDump) {
  for(var i = 0, n = agencyDump.i.length; i < n; i++) {
    var idolDump = agencyDump.i[i];
    var idol = new Idol(idolDump.i);

    for(var si = 0, sn = STATS.length; si < sn; si++) {
      idol[STATS[si]] = idolDump.s[si];
    }

    this.addIdol(idol);
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
    e.preventDefault();
    barcodeImage.click();
  });

  document.getElementById('fight').addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    if (agency.unit.length > 0) {
      player = new BattleIdol(agency.unit[0]);
      enemy = new BattleIdol(new Idol(Math.random()));
      initBattle();
    } else {
      alert('You need an idol to fight.');
    }
    return false;
  });

  var stateString = btoa(JSON.stringify(agency.dump()));
  // window.location.hash = stateString;
  document.cookie = 'state=' + stateString + cookieSuffix;
}

if (window.location.hash === '#icon') {
  document.body.innerHTML = '<div class="icon-container"><div class="portrait">' + new Idol(Math.random()).spriteHTML() + '</div></div>';
  document.body.classList.add('icon');
} else {
  document.addEventListener('DOMContentLoaded', function() {
    FastClick.attach(document.body);

    var savedStateString = window.location.hash.replace(/^#/, '') || getStateCookie();
    if (!!savedStateString) {
      agency.load(JSON.parse(atob(savedStateString)));
    }

    rerender();
  });
}
