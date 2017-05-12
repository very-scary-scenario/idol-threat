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
  // 'pya', 'pyu', 'pyo',
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
var AFFINITIES = ['rock', 'paper', 'scissors'];
var RARITIES = [
  'Charred',
  'Well done',
  'Medium well',
  'Medium',
  'Medium rare',
  'Rare',
  'Blue',
  'Raw',
  'Mooing'
];
var BASE_RARITY = 300;
var RARITY_CURVE = 0.6;

var POSES;
var HAIR_COLOURS;
var SKIN_COLOURS;

var cookieExpiryDate = new Date();
cookieExpiryDate.setFullYear(cookieExpiryDate.getFullYear() + 50);
var cookieSuffix = '; expires=' + cookieExpiryDate.toUTCString();
var cookieSliceSize = 2000;
var endString = 'end';

var idolSorters = {
  date: function(a, b) { return b.recruitedAt - a.recruitedAt; },
  statSpeed: function(a, b) { return (b.speed + b.speedBonus) - (a.speed + a.speedBonus); },
  statEndurance: function(a, b) { return (b.endurance + b.enduranceBonus) - (a.endurance + a.enduranceBonus); },
  statAttack: function(a, b) { return (b.attack + b.attackBonus) - (a.attack + a.attackBonus); },
  statDefense: function(a, b) { return (b.defense + b.defenseBonus) - (a.defense + a.defenseBonus); },
  unitMembership: function(a, b) { return (Number(b.isInUnit()) - Number(a.isInUnit())); },
  allStats: function(a, b) { return b.totalStats() - a.totalStats(); },
  affinity: function(a, b) { return (
    (AFFINITIES.indexOf(a.affinity) - AFFINITIES.indexOf(b.affinity)) +
    (idolSorters.allStats(a, b) / 10000)
  ); }
};

var idolSortNames = {
  date: 'Date recruited',
  statSpeed: 'Speed',
  statEndurance: 'Endurance',
  statAttack: 'Attack',
  statDefense: 'Defense',
  allStats: 'Total of all stats',
  affinity: 'Affinity and stats',
  unitMembership: 'Unit membership'
};

function getStateCookie() {
  var cookieStrings = document.cookie.split(';');

  indices = [];
  fragments = {};

  for(var i = 0, n = cookieStrings.length; i < n; i++) {
    var matches = cookieStrings[i].match(/(?:state_(\d+)+=)(.*)/);
    if (!matches) {
      continue;
    }
    var index = parseInt(matches[1], 10);
    var fragment = matches[2];
    indices.push(index);
    fragments[index] = fragment;
  }
  
  indices.sort(function(a, b) { return a - b; });

  var stateString = '';

  for (var f = 0; f < indices.length; f++) {
    var thisFragment = fragments[indices[f]];
    if (thisFragment === endString) break;
    stateString += thisFragment;
  }

  return atob(stateString);
}

var barcodeImage = document.getElementById('barcode-image');
var detailElement = document.getElementById('idol-detail');
var catalogElement = document.getElementById('catalog');
var unitElement = document.getElementById('unit');
var battleElement = document.getElementById('battle');
var promptArea = document.getElementById('prompt-area');
var auditionSpace = document.getElementById('audition-space');
var canteenElement = document.getElementById('canteen');
var theatreElement = document.getElementById('theatre');

var spriteTemplate = Handlebars.compile(document.getElementById('sprite-template').innerHTML);
var catalogTemplate = Handlebars.compile(document.getElementById('catalog-template').innerHTML);
var unitTemplate = Handlebars.compile(document.getElementById('unit-template').innerHTML);
var idolDetailTemplate = Handlebars.compile(document.getElementById('idol-detail-template').innerHTML);
var battleTemplate = Handlebars.compile(document.getElementById('battle-template').innerHTML);
var healthBarTemplate = Handlebars.compile(document.getElementById('health-bar-template').innerHTML);
var abilityPromptTemplate = Handlebars.compile(document.getElementById('ability-prompt-template').innerHTML);
var promptTemplate = Handlebars.compile(document.getElementById('prompt-template').innerHTML);
var auditionTemplate = Handlebars.compile(document.getElementById('audition-template').innerHTML);
var canteenTemplate = Handlebars.compile(document.getElementById('canteen-template').innerHTML);
var canteenConfirmTemplate = Handlebars.compile(document.getElementById('canteen-confirm-template').innerHTML);
var theatreTemplate = Handlebars.compile(document.getElementById('theatre-template').innerHTML);

var maxUnitSize = 3;
var rerenderTimeout;

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

function askUser(question, answers) {
  if (answers === undefined) answers = [['Okay', null]];

  promptArea.innerHTML = promptTemplate({
    'question': question,
    'answers': answers
  });

  function doAnswer(event) {
    event.stopPropagation();
    event.preventDefault();
    var answerIndex = parseInt(event.currentTarget.getAttribute('data-answer-index'), 10);
    promptArea.innerHTML = '';
    var func = answers[answerIndex][1];
    if (func) func();
  }

  for (var i = 0; i < answers.length; i++) {
    promptArea.querySelector('a[data-answer-index="' + i.toString() + '"]').addEventListener('click', doAnswer);
  }
}

function getRarity(stats) {
  if (stats < 0) return RARITIES[0];
  rarityIndex = Math.floor(Math.pow(stats/BASE_RARITY, RARITY_CURVE));
  return RARITIES[rarityIndex] || RARITIES[RARITIES.length - 1];
}

function Ability(parts, animation, affinity) {
  this.strength = 0;
  this.healing = false;
  this.affinity = affinity;

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
  var self = this;

  this.recruitedAt = new Date().getTime();
  this.seed = seed;
  this.identifier = seed.toString(10);
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

  this.renderedSprites = {};
  this.loadedImages = {};

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
    this.abilities.push(new Ability(abilityParts, choice(ANIMATIONS, this.rand()), choice(AFFINITIES, this.rand())));
  }

  // build affinity
  this.affinity = choice(AFFINITIES, this.rand());
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
Idol.prototype.deferRendering = function(mode) {
  var self = this;
  mode = mode || 'med';

  if (this.loadedImages[mode] !== undefined) return;  // we're already loading

  var loaded = 0;
  var images = [];
  this.loadedImages[mode] = images;

  function renderIfLoaded() {
    loaded++;
    if (loaded === self.parts.length) self.renderSprite(mode);
  }

  for (var pi = 0; pi < this.parts.length; pi++) {
    var chosenPart = this.parts[pi];
    var img = new Image();

    images.push(img);
    var attr = mode + 'Path';
    if (mode === 'huge') attr = 'path';
    img.src = chosenPart[attr];
    img.addEventListener('load', renderIfLoaded);
  }
};
Idol.prototype.getSprite = function(mode) {
  if (typeof(mode) !== 'string') mode = undefined;
  var sprite = this.renderedSprites[mode || 'med'];
  if (sprite === undefined) {
    this.deferRendering(mode);
    return this.renderedSprites.thumb || 'placeholder.png';
  }
  return sprite;
};
Idol.prototype.getThumbSprite = function() { return this.getSprite('thumb'); };
Idol.prototype.getHugeSprite = function() { return this.getSprite('huge'); };
Idol.prototype.canFeed = function() { return this.agency.canFeed(); };
Idol.prototype.renderSprite = function(mode) {
  if (mode === undefined) mode = 'med';

  var images = this.loadedImages[mode];

  var offscreenCanvasElement = document.createElement('canvas');
  var offscreenCanvas = offscreenCanvasElement.getContext('2d');

  if (mode === 'med') {
    offscreenCanvas.canvas.width = 1000;
    offscreenCanvas.canvas.height = 1684;
  } else if (mode === 'thumb') {
    offscreenCanvas.canvas.width = 400;
    offscreenCanvas.canvas.height = 674;
  } else if (mode === 'huge') {
    offscreenCanvas.canvas.width = 1518;
    offscreenCanvas.canvas.height = 2556;
  }

  offscreenCanvas.clearRect(0, 0, offscreenCanvas.canvas.width, offscreenCanvas.canvas.height);

  for (var i = 0; i < images.length; i++) {
    offscreenCanvas.drawImage(images[i], 0, 0);
  }

  this.renderedSprites[mode] = offscreenCanvasElement.toDataURL();

  var subbableImages = document.querySelectorAll('.sprite img[data-sprite-' + mode + '-id="' + this.identifier + '"]');
  for (var si = 0; si < subbableImages.length; si++) {
    subbableImages[si].src = this.renderedSprites[mode];
  }

  this.loadedImages[mode] = undefined;  // free up some memory?
};
Idol.prototype.spriteHTML = function(mode) {
  if (mode === undefined || typeof(mode) !== 'string') mode = 'med';
  var sprite;

  if (mode === 'med') {
    sprite = this.getSprite();
  } else if (mode === 'thumb') {
    sprite = this.getThumbSprite();
  } else if (mode === 'huge') {
    sprite = this.getHugeSprite();
  } else {
    throw 'what is ' + mode;
  }

  return spriteTemplate({
    mode: mode,
    identifier: this.identifier,
    sprite: sprite
  });
};
Idol.prototype.thumbSpriteHTML = function() { return this.spriteHTML('thumb'); };
Idol.prototype.hugeSpriteHTML = function() { return this.spriteHTML('huge'); };
Idol.prototype.isInUnit = function() {
  return agency.unit.indexOf(this) !== -1;
};
Idol.prototype.totalStats = function() {
  var total = 0;

  for (var i = 0; i < STATS.length; i++) {
    total += this[STATS[i]];
  }

  return total;
};
Idol.prototype.rarity = function() {
  return getRarity(this.totalStats());
};
Idol.prototype.toggleUnitMembership = function() {
  if (this.isInUnit()) {
    agency.unit.splice(agency.unit.indexOf(this), 1);
    if (this.catalogElement !== undefined) {
      this.catalogElement.classList.remove('active');
    }
  } else {
    agency.addToUnit(this, true);
  }

  agency.renderUnit();
  saveGame();
};
Idol.prototype.giveBonus = function(count) {
  if (count === undefined) count = 1;

  while (count > 0) {
    count--;
    this[choice(STATS, Math.random()) + 'Bonus']++;
  }

  deferRerender();
};
Idol.prototype.showDetail = function() {
  var self = this;

  detailElement.innerHTML = idolDetailTemplate(this);
  detailElement.setAttribute('data-affinity', this.affinity);
  detailElement.classList.add('shown');
	detailElement.querySelector('.close').addEventListener('click', hideIdolDetail);

  function showFeedingUI(event) {
    event.stopPropagation();
    event.preventDefault();

    var catalogWithoutSelf = self.agency.sortedCatalog();
    catalogWithoutSelf.splice(catalogWithoutSelf.indexOf(self), 1);

    canteenElement.innerHTML = canteenTemplate({
      idol: self,
      catalog: catalogWithoutSelf
    });

    canteenElement.querySelector('.cancel').addEventListener('click', function(event) {
      event.stopPropagation();
      event.preventDefault();
      canteenElement.innerHTML = '';
    });

    function requestFeeding(event) {
      event.stopPropagation();
      event.preventDefault();
      var foodIdol = catalogWithoutSelf[parseInt(event.currentTarget.getAttribute('data-index'), 10)];

      var summedStats = {};
      for (var i = 0; i < STATS.length; i++) summedStats[STATS[i]] = self[STATS[i]] + foodIdol[STATS[i]];

      canteenElement.innerHTML = canteenConfirmTemplate({
        idol: self,
        food: foodIdol,
        summedStats: summedStats
      });

      canteenElement.querySelector('.no').addEventListener('click', showFeedingUI);
      canteenElement.querySelector('.yes').addEventListener('click', function(event) {
        event.stopPropagation();
        event.preventDefault();
        for (var stat in summedStats) {
          self[stat] = summedStats[stat];
        }
        agency.removeIdol(foodIdol);
        canteenElement.innerHTML = '';
        self.showDetail();
        askUser('Training complete.');
      });
    }

    var idolElements = canteenElement.querySelectorAll('.idol');
    for (var i = 0; i < idolElements.length; i++) {
      idolElements[i].addEventListener('click', requestFeeding);
    }
  }

  var feedElement = detailElement.querySelector('.feed');
  if (feedElement) feedElement.addEventListener('click', showFeedingUI);

  detailElement.querySelector('.graduate').addEventListener('click', function(event) {
    event.stopPropagation();
    event.preventDefault();
    askUser('Do you want ' + self.name + ' to graduate? She will leave your agency and every other idol will get a stat bonus by attending the graduation party.', [
      ['Graduate', function() {
        detailElement.classList.remove('shown');
        agency.removeIdol(self);

        for (var i = 0; i < agency.catalog.length; i++) {
          agency.catalog[i].giveBonus();
        }

        rerender();
      }],
      ['Keep', function() {}]
    ]);
  });
};
Idol.prototype.audition = function() {
  var self = this;
  var layerTimeout = 200;
  auditionSpace.innerHTML = auditionTemplate(this);
  
  var currentLayer = 0;

  function addLayerToAuditionPortrait() {
    var portraitElement = document.querySelector('#audition .portrait');
    if (!portraitElement) return;

    var part = self.parts[currentLayer];
    if (!part) return;

    var img = new Image();
    img.src = part.path;
    portraitElement.appendChild(img);
    currentLayer++;
    setTimeout(addLayerToAuditionPortrait, layerTimeout);
  }

  setTimeout(addLayerToAuditionPortrait, layerTimeout);

  document.getElementById('catch-button').addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    auditionSpace.innerHTML = '';
    self.showDetail();
  });
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
  this.storyChapter = 0;
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
    'hasStoryRemaining': CAMPAIGN[this.storyChapter] !== undefined,
    'canFeed': this.canFeed(),
    'sortOrder': this.sortOrder,
    'sortOrders': sortOrders
  });

  function setSortOrder(event) {
    agency.sortOrder = event.currentTarget.getAttribute('data-sort-order');
    rerender();
  }

  document.getElementById('sort-button').addEventListener('click', function(event) {
    event.stopPropagation();
    event.preventDefault();
    document.getElementById('sort-orders').classList.toggle('visible');
  });

  for (var sortKey in idolSortNames) {
    element = document.querySelector('#sort-list a[data-sort-order="' + sortKey + '"]');
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
    sortedCatalog[j].catalogElement = li;
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
Agency.prototype.addIdol = function(idol, interactive) {
  if ((this.catalog.length === 0) && document.body.classList.contains('nothing-scanned')) {
    document.body.removeChild(document.getElementById('title'));
    document.body.classList.remove('nothing-scanned');
  }

  for(var i = 0, n = this.catalog.length; i < n; i++) {
    if (this.catalog[i].seed === idol.seed) {
      askUser("You recruited this idol already; it's " + idol.name + "!");
      return;
    }
  }
  this.catalog.push(idol);
  idol.agency = this;
  this.addToUnit(idol);
  deferRerender();

  if (interactive) {
    idol.audition();
  }
};
Agency.prototype.removeIdol = function(idol) {
  if (idol.isInUnit()) agency.unit.splice(agency.catalog.indexOf(idol), 1);
  agency.catalog.splice(agency.catalog.indexOf(idol), 1);
  deferRerender();
};
Agency.prototype.addToUnit = function(idol, interactive) {
  if (this.unit.length >= maxUnitSize) {
    if (interactive !== undefined) {
      askUser("Your unit is full; you'll need to remove someone before you can add " + idol.name + ".");
    }
  } else {
    this.unit.push(idol);
    if (idol.catalogElement !== undefined) idol.catalogElement.classList.add('active');
  }
};
Agency.prototype.canFeed = function() {
  return this.catalog.length >= 2;
};
Agency.prototype.doStory = function(pageNumber) {
  if (pageNumber === undefined) pageNumber = 0;
  var chapter = CAMPAIGN[this.storyChapter];
  var page = chapter[pageNumber];
  var self = this;

  if (page === undefined) {
    theatreElement.innerHTML = '';
    this.storyChapter++;
    rerender();
  } else if (page.kind === 'setting') {
    this.storySetting = page.value;
    this.doStory(pageNumber + 1);
  } else if (page.kind === 'text') {
    theatreElement.innerHTML = theatreTemplate({
      background: this.storySetting,
      text: page.text
    });
    document.getElementById('script').addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      self.doStory(pageNumber + 1);
    });
  } else if (page.kind === 'battle') {
    theatreElement.innerHTML = '';
    var playerIdols = [];

    for (var pi = 0; pi < agency.unit.length; pi++) {
      playerIdols.push(new BattleIdol(agency.unit[pi], 'player'));
    }

    var enemyIdols = [];

    for (var ei = maxUnitSize; ei > 0; ei--) {
      var enemyIdol = new Idol(Math.random());
      for (var si = 0; si < STATS.length; si++) {
        enemyIdol[STATS[si]] = enemyIdol[STATS[si]] + page.strength;
      }
      enemyIdols.push(new BattleIdol(enemyIdol, 'ai'));
    }

    var battle = new Battle(playerIdols, enemyIdols, function() {
      for (var pi = 0; pi < this.playerIdols.length; pi++) {
        this.playerIdols[pi].idol.giveBonus(enemyIdols.length);
      }

      self.doStory(pageNumber + 1);
    }, function() {
      theatreElement.innerHTML = '';
      askUser('You lost the battle. Train up your unit some more and try again!');
    });

    battle.loop();
  }
};
Agency.prototype.dump = function() {
  var agencyDump = {
    i: [],
    u: [],
    c: this.storyChapter,
    o: this.sortOrder
  };

  for(var i = 0, n = this.catalog.length; i < n; i++) {
    idol = this.catalog[i];
    agencyDump.i.push(idol.dump());
    agencyDump.u.push(Number(idol.isInUnit()));
  }

  return agencyDump;
};
Agency.prototype.load = function(agencyDump) {
  if (agencyDump.o !== undefined) this.sortOrder = agencyDump.o;
  this.storyChapter = agencyDump.c || 0;

  for(var i = 0, n = agencyDump.i.length; i < n; i++) {
    var idolDump = agencyDump.i[i];
    var idol = new Idol(idolDump.i);

    idol.recruitedAt = idolDump.a;

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
    askUser("Sorry, we couldn't read a barcode in that picture, please try a clearer photo.");
    return;
  }
  idol = new Idol(numFromString(data.codeResult.code));
  agency.addIdol(idol, true);
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

  var fightButton = document.getElementById('fight');
  if (fightButton) fightButton.addEventListener('click', function(e) {
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

      var battle = new Battle(playerIdols, enemyIdols, function() {
        askUser('You win! Your unit gets bonuses~', [['Yay!', null]]);
        for (var pi = 0; pi < this.playerIdols.length; pi++) {
          this.playerIdols[pi].idol.giveBonus(enemyIdols.length);
        }
        rerender();
      }, function() {
        askUser('You lose :<', [['Aww, beans…', null]]);
      });

      battle.loop();
    } else {
      askUser('You need an idol in your unit to fight.');
    }
    return false;
  });

  var storyButton = document.getElementById('progress-story');
  if (storyButton) storyButton.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();

    if (agency.unit.length > 0) {
      agency.doStory();
    } else {
      askUser('You need an idol in your unit to progress in the story.');
    }
  });

  var randomFightButton = document.getElementById('random-fight');
  if (randomFightButton) randomFightButton.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();

    var playerIdols = [];
    var enemyIdols = [];
    for (var i = maxUnitSize; i > 0; i--) {
      enemyIdols.push(new BattleIdol(new Idol(Math.random()), 'ai'));
      playerIdols.push(new BattleIdol(new Idol(Math.random()), 'player'));
    }

    var battle = new Battle(playerIdols, enemyIdols, function() {
      askUser('You win!', [['Yay!', null]]);
    }, function() {
      askUser('You lose :<', [['Aww, beans…', null]]);
    });

    battle.loop();
  });

  saveGame();
}

function saveGame() {
  var fullStateString = JSON.stringify(agency.dump());
  var stateString = btoa(fullStateString);
  var currentIndex = 0;

  while (stateString) {
    var slice = stateString.slice(0, cookieSliceSize);
    stateString = stateString.slice(cookieSliceSize);
    document.cookie = 'state_' + currentIndex.toString(10) + '=' + slice + cookieSuffix;
    currentIndex++;
  }

  document.cookie = 'state_' + currentIndex.toString(10) + '=' + endString + cookieSuffix;

  if (fullStateString !== getStateCookie()) {
    console.log(fullStateString);
    console.log(getStateCookie());
    askUser('saving failed! this is a bug, so im not sure what to recommend');
  }
}

function deferRerender() {
  clearTimeout(rerenderTimeout);
  rerenderTimeout = setTimeout(rerender, 50);
}

function initGame() {
  FastClick.attach(document.body);
  document.getElementById('loading').innerText = '';

  try {
    var savedStateString = getStateCookie();
    if (!!savedStateString) {
      var agencyDump = JSON.parse(savedStateString);
      agency.load(agencyDump);
    }
  } catch (e) {
    console.log(e);
    askUser('Your save game failed to load, sorry :<');
  }

  rerender();
}

if (window.location.hash === '#icon') {
  var iconIdol = new Idol(Math.random());
  document.body.innerHTML = '<div class="icon-container affinity-' + iconIdol.affinity + '"><div class="portrait">' + iconIdol.hugeSpriteHTML() + '</div></div>';
  document.body.classList.add('icon');
} else {
  document.addEventListener('DOMContentLoaded', function() {
    initGame();
    // document.getElementById('fight').click();
    // document.getElementById('progress-story').click();
    // agency.addIdol(new Idol(Math.random()), true);
  });
}
