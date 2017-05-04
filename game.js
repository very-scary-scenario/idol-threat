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
var POSES;
var HAIR_COLOURS;
var SKIN_COLOURS;

var cookieExpiryDate = new Date();
cookieExpiryDate.setFullYear(cookieExpiryDate.getFullYear() + 50);
var cookieSuffix = '; expires=' + cookieExpiryDate.toUTCString();

var idolSorters = {
  date: function(a, b) { return b.recruitedAt - a.recruitedAt; },
  speed: function(a, b) { return (b.speed + b.speedBonus) - (a.speed + a.speedBonus); },
  endurance: function(a, b) { return (b.endurance + b.enduranceBonus) - (a.endurance + a.enduranceBonus); },
  attack: function(a, b) { return (b.attack + b.attackBonus) - (a.attack + a.attackBonus); },
  defense: function(a, b) { return (b.defense + b.defenseBonus) - (a.defense + a.defenseBonus); },
  allStats: function(a, b) { return idolSorters.speed(a, b) +
                                    idolSorters.endurance(a, b) +
                                    idolSorters.attack(a, b) +
                                    idolSorters.defense(a, b); }
};

var idolSortNames = {
  date: 'Date recruited',
  speed: 'Speed',
  endurance: 'Endurance',
  attack: 'Attack',
  defense: 'Defense',
  allStats: 'Total of all stats'
};

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
var catalogElement = document.getElementById('catalog');
var unitElement = document.getElementById('unit');
var battleElement = document.getElementById('battle');

var spriteTemplate = Handlebars.compile(document.getElementById('sprite-template').innerHTML);
var catalogTemplate = Handlebars.compile(document.getElementById('catalog-template').innerHTML);
var unitTemplate = Handlebars.compile(document.getElementById('unit-template').innerHTML);
var idolDetailTemplate = Handlebars.compile(document.getElementById('idol-detail-template').innerHTML);
var battleTemplate = Handlebars.compile(document.getElementById('battle-template').innerHTML);
var healthBarTemplate = Handlebars.compile(document.getElementById('health-bar-template').innerHTML);
var abilityPromptTemplate = Handlebars.compile(document.getElementById('ability-prompt-template').innerHTML);
var targetPromptElement = Handlebars.compile(document.getElementById('ability-prompt-template').innerHTML);

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
  this.recruitedAt = new Date();
  this.seed = seed;
  this.rand = seededRandom(seed);
  this.xp = 0;
  this.level = 0;

  // build stats
  for(var i = 0, n = STATS.length; i < n; i++) {
    this[STATS[i]] = Math.floor(this.rand(-100, 100));
    this[STATS[i] + 'Bonus'] = 0;
  }

  this.abilities = [];

  // build name
  this.firstName = this.generateName();
  this.lastName = this.generateName();
  this.name = [this.firstName, this.lastName].join(' ');

  // build portrait
  var partsMissing = true;
  var pose, skinColour, hairColour;
  function partIsAllowed(part) {
    if (part.pose && part.pose !== pose) return false;
    if (part.skinColour && part.skinColour !== skinColour) return false;
    if (part.hairColour && part.hairColour !== hairColour) return false;
    return true;
  }
  while (partsMissing) {
    partsMissing = false;
    pose = choice(POSES, this.rand());
    skinColour = choice(SKIN_COLOURS, this.rand());
    hairColour = choice(HAIR_COLOURS, this.rand());

    this.parts = [];

    for(var li = 0, ln = LAYERS.length; li < ln; li++) {
      var options = PARTS[LAYERS[li]].filter(partIsAllowed);
      if (options.length === 0) {
        partsMissing = true;
      } else {
        this.parts.push(choice(options, this.rand()));
      }
    }
  }

  // build bio
  var bioParts = [];
  while(bioParts.length < 3) {
    var part = choice(BIOS, this.rand());
    if (bioParts.indexOf(part) === -1) {
      bioParts.push(part);
    }
  }
  this.bio = bioParts.join(' ');
  this.quote = choice(QUOTES, this.rand());

  // build moveset
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
    if (this.rand() > 0.9) name += N;
    kanaCount--;
  }
  name = name[0].toUpperCase() + name.slice(1);
  return name;
};
Idol.prototype.spriteHTML = function(mode) {
  return spriteTemplate({
    parts: this.parts,
    thumb: mode === 'thumb'
  });
};
Idol.prototype.thumbSpriteHTML = function() { return this.spriteHTML('thumb'); };
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
Idol.prototype.giveBonus = function(count) {
  if (count === undefined) count = 1;

  while (count > 0) {
    count--;
    this[choice(STATS, Math.random()) + 'Bonus']++;
  }
};
Idol.prototype.showDetail = function() {
  detailElement.innerHTML = idolDetailTemplate(this);
  detailElement.classList.add('shown');
	detailElement.querySelector('.close').addEventListener('click', hideIdolDetail);
};
Idol.prototype.dump = function() {
  var idolDump = {
    i: this.seed,
    a: this.recruitedAt,
    s: [],
    b: []
  };
  for(var i = 0, n = STATS.length; i < n; i++) {
    idolDump.s.push(this[STATS[i]]);
    idolDump.b.push(this[STATS[i] + 'Bonus']);
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
  this.sortOrder = 'date';
}
Agency.prototype.renderCatalog = function() {
  var sortedCatalog = this.sortedCatalog();

  sortOrders = [];

  for (var key in idolSortNames) {
    var item = [key, idolSortNames[key]];
    if (this.sortOrder === key) item.isSelectedOrder = true;
    sortOrders.push(item);
  }

  sortOrders.sort();

  catalogElement.innerHTML = catalogTemplate({
    'catalog': sortedCatalog,
    'canFeed': this.canFeed(),
    'sortOrder': this.sortOrder,
    'sortOrders': sortOrders
  });

  function setSortOrder(event) {
    agency.sortOrder = event.currentTarget.getAttribute('data-sort-order');
    rerender();
  }

  for (var sortKey in idolSortNames) {
    element = document.querySelector('#sort-orders a[data-sort-order="' + sortKey + '"]');
    if (element) element.addEventListener('click', setSortOrder);
  }

  var agency = this;

  inputs = document.querySelectorAll('#catalog li.idol .input');

  function toggleMembership(event) {
    event.stopPropagation();
    event.preventDefault();
    i = parseInt(event.currentTarget.getAttribute('data-index'), 10);
    sortedCatalog[i].toggleUnitMembership();
  }

  for (var i = 0, n = inputs.length; i < n; i++) {
    var element = inputs[i];
    element.addEventListener('click', toggleMembership);
  }

  var lis = document.querySelectorAll('#catalog li.idol');

  function showDetail(event) {
    event.stopPropagation();
    event.preventDefault();
    i = parseInt(event.currentTarget.getAttribute('data-index'), 10);
    sortedCatalog[i].showDetail();
  }

  for (var j = 0, m = lis.length; j < m; j++) {
    var li = lis[j];
    li.addEventListener('click', showDetail);
  }
};
Agency.prototype.sortedCatalog = function() {
  var sortedCatalog = [];
  for (var i = 0; i < this.catalog.length; i++) {
    sortedCatalog.push(this.catalog[i]);
  }
  sortedCatalog.sort(idolSorters[this.sortOrder]);
  return sortedCatalog;
};
Agency.prototype.renderUnit = function() {
  content = unitTemplate(this);

  if ((this.unit.length === 0) ^ unitElement.classList.contains('empty')) {
    unitElement.classList.toggle('empty');
  }

  unitElement.innerHTML = content;
};
Agency.prototype.addIdol = function(idol) {
  if ((this.catalog.length === 0) && document.body.classList.contains('nothing-scanned')) {
    document.body.removeChild(document.getElementById('title'));
    document.body.classList.remove('nothing-scanned');
  }

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
Agency.prototype.canFeed = function() {
  return this.catalog.length >= 2;
};
Agency.prototype.dump = function() {
  var agencyDump = {
    i: [],
    u: [],
    o: this.sortOrder
  };

  for(var i = 0, n = this.catalog.length; i < n; i++) {
    idol = this.catalog[i];
    agencyDump.i.push(idol.dump());
    agencyDump.u.push(idol.isInUnit());
  }

  return agencyDump;
};
Agency.prototype.load = function(agencyDump) {
  if (agencyDump.o !== undefined) this.sortOrder = agencyDump.o;

  for(var i = 0, n = agencyDump.i.length; i < n; i++) {
    var idolDump = agencyDump.i[i];
    var idol = new Idol(idolDump.i);
    if (idolDump.a !== undefined) idol.recruitedAt = new Date(idolDump.a);

    for(var si = 0, sn = STATS.length; si < sn; si++) {
      idol[STATS[si]] = idolDump.s[si];
      idol[STATS[si] + 'Bonus'] = (idolDump.b || {})[si] || 0;
    }

    this.addIdol(idol);

    if (agencyDump.u[i] !== idol.isInUnit()) {
      idol.toggleUnitMembership();
    }
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
      var playerIdols = [];
      for (var pi = 0; pi < agency.unit.length; pi++) {
        playerIdols.push(new BattleIdol(agency.unit[pi], 'player'));
      }

      var enemyIdols = [];
      for (var ei = maxUnitSize; ei > 0; ei--) {
        enemyIdols.push(new BattleIdol(new Idol(Math.random()), 'ai'));
      }

      var battle = new Battle(playerIdols, enemyIdols);
      battle.loop();
    } else {
      alert('You need an idol in your unit to fight.');
    }
    return false;
  });

  var stateString = btoa(JSON.stringify(agency.dump()));
  // window.location.hash = stateString;
  document.cookie = 'state=' + stateString + cookieSuffix;
}

function initGame() {
  FastClick.attach(document.body);
  document.getElementById('loading').innerText = '';

  var savedStateString = getStateCookie();
  if (!!savedStateString) {
    agency.load(JSON.parse(atob(savedStateString)));
  }

  rerender();
}

if (window.location.hash === '#icon') {
  document.body.innerHTML = '<div class="icon-container"><div class="portrait">' + new Idol(Math.random()).spriteHTML() + '</div></div>';
  document.body.classList.add('icon');
} else {
  document.addEventListener('DOMContentLoaded', function() {
    initGame();
    // document.getElementById('fight').click();
  });
}
