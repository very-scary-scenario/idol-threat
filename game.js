var VOWELS = 'aeiou';
var N = 'n';
var STATS = [
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

var MAXIMUM_CATALOG_SIZE = 50;
var CATALOG_FULL = "Your agency is full! You'll have to graduate or train with some of them before you can recruit any more.";

var SEED_OVERRIDE_HANDLERS = {
  shadow: function(idol) {
    idol.firstName = 'Jack';
    idol.lastName = 'Ryan';
    idol.cacheName();
    idol.defense = 100;
    idol.attack = 100;
    idol.speed = 100;
    idol.bio = "Somebody tried to kill her. She lied to her wife for three years. Didn't give them her PhD.";
    idol.quote = "Now, talk me through your very scary scenario.";

    function makeSpecialAbility(name, affinity) {
      return new Ability(idol, [{words: [name], bonus: 3}], choice(ANIMATIONS, idol.rand()), affinity);
    }

    idol.abilities = [
      makeSpecialAbility('play rough', AFFINITIES[0]),
      makeSpecialAbility('geopolitics', AFFINITIES[1]),
      makeSpecialAbility('american directness', AFFINITIES[2]),
      makeSpecialAbility('very scary scenario', idol.affinity)
    ];
  }
};
for (var overrideName in SEED_OVERRIDE_HANDLERS) SEED_OVERRIDE_HANDLERS[overrideName].overrideName = overrideName;
var SEED_OVERRIDES = {};

function parsePresetBarcodes() {
  // cache what overrides we need to apply for a given seed
  var overrideList;

  for (var override in BARCODES) {
    overrideList = BARCODES[override];

    for (var i = 0; i < overrideList.length; i++) {
      SEED_OVERRIDES[numFromString(overrideList[i])] = SEED_OVERRIDE_HANDLERS[override];
    }
  }
}

var BOSSES = {};

function getBoss(name) {
  if (BOSS_NAMES.indexOf(name) === -1) throw name + ' is not a real boss';
  boss = new Idol(numFromString(name));
  var path = 'bosses/' + name + '.png';
  boss.parts = [{path: path, medPath: path, thumbPath: path}];
  return boss;
}

var LETTER_DELAY = 20;
var LETTER_EMPHASIS_MULTIPLIER = 4;
var LETTER_DELAYS = {
  '.': 8,
  ',': 4
};

var NEGATIVE_STAT_EFFECT = 2;

var PRESTIGE_DIFFICULTY_INCREASE = 600;

var RECENT_FIRING_MEMORY = 20;

var POSES;
var HAIR_COLOURS;
var SKIN_COLOURS;

var confettiTimeout;

var cookieExpiryDate = new Date();
cookieExpiryDate.setFullYear(cookieExpiryDate.getFullYear() + 50);
var cookieSuffix = '; expires=' + cookieExpiryDate.toUTCString();
var cookieSliceSize = 2000;
var endString = 'end';

var isSkipping = false;

var idolSorters = {
  date: function(a, b) { return b.recruitedAt - a.recruitedAt; },
  statSpeed: function(a, b) { return b.speed - a.speed; },
  statAttack: function(a, b) { return b.attack - a.attack; },
  statDefense: function(a, b) { return b.defense - a.defense; },
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
  statAttack: 'Attack',
  statDefense: 'Defense',
  allStats: 'Total of all stats',
  affinity: 'Affinity and stats',
  unitMembership: 'Unit membership'
};

var upgradeNames = {
  attack: {
    name: "Attack level",
    description: "Vocal coaches will have access to better equipment, improving their ability to teach idols how to sing with impact."
  },
  defense: {
    name: "Defense level",
    description: "Designers will have access to better costume materials, improving their ability to create idol costumes that withstand enemy attacks."
  },
  speed: {
    name: "Speed level",
    description: "Choreographers will have access to better studios, improving their ability to teach idols faster and more complicated dances."
  },
  recruitment: {
    name: "Scouting level",
    description: "Scouts will have access to better snacks, improving their ability to find stand-out idols."
  },
  graduation: {
    name: "Graduation level",
    description: "Managers will have access to better leaving card designs, improving their ability to send idols home with a smile on their face."
  }
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
var loadGame = document.getElementById('load-game');
var detailElement = document.getElementById('idol-detail');
var catalogElement = document.getElementById('catalog');
var unitElement = document.getElementById('unit');
var battleElement = document.getElementById('battle');
var promptArea = document.getElementById('prompt-area');
var auditionSpace = document.getElementById('audition-space');
var canteenElement = document.getElementById('canteen');
var theatreElement = document.getElementById('theatre');
var xpIndicatorsElement = document.getElementById('xp-indicators');

var spriteTemplate = Handlebars.compile(document.getElementById('sprite-template').innerHTML);
var catalogTemplate = Handlebars.compile(document.getElementById('catalog-template').innerHTML);
var unitTemplate = Handlebars.compile(document.getElementById('unit-template').innerHTML);
var idolDetailTemplate = Handlebars.compile(document.getElementById('idol-detail-template').innerHTML);
var battleTemplate = Handlebars.compile(document.getElementById('battle-template').innerHTML);
var idolDeetsTemplate = Handlebars.compile(document.getElementById('idol-deets-template').innerHTML);
var healthBarTemplate = Handlebars.compile(document.getElementById('health-bar-template').innerHTML);
var abilityPromptTemplate = Handlebars.compile(document.getElementById('ability-prompt-template').innerHTML);
var promptTemplate = Handlebars.compile(document.getElementById('prompt-template').innerHTML);
var auditionTemplate = Handlebars.compile(document.getElementById('audition-template').innerHTML);
var canteenTemplate = Handlebars.compile(document.getElementById('canteen-template').innerHTML);
var canteenConfirmTemplate = Handlebars.compile(document.getElementById('canteen-confirm-template').innerHTML);
var theatreTemplate = Handlebars.compile(document.getElementById('theatre-template').innerHTML);

var maxUnitSize = 3;
var rerenderTimeout;
var checkSaveTimeout;

var currentlyShowingDetail;

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

  rand();

  return rand;
}

function celebrate(density) {
  confetti.setDensity(density);
  if (!confettiTimeout) confetti.restart();

  clearTimeout(confettiTimeout);
  confettiTimeout = setTimeout(function() {
    confetti.stop();
    clearTimeout(confettiTimeout);
    confettiTimeout = undefined;
  }, 3000);
}

var sparkleImage = new Image();
sparkleImage.src = 'lib/sparkle/sparkle.png';

function initSparkle(sparkleCanvas) {
  var sparkleContext = sparkleCanvas.getContext('2d');
  var sparkleEmitter = new SparkleEmitter(sparkleCanvas);

  sparkleCanvas.width = sparkleCanvas.clientWidth * (window.devicePixelRatio || 1);
  sparkleCanvas.height = sparkleCanvas.clientHeight * (window.devicePixelRatio || 1);

  sparkleEmitter.setParticlesPerSecond(40);
  sparkleEmitter.setParticleLifetime(15);
  sparkleEmitter.setPosition({x: sparkleCanvas.width/2, y: -(sparkleCanvas.height/5)});
  sparkleEmitter.setGravity(sparkleCanvas.clientHeight/3);
  sparkleEmitter.setParticleSpeed(sparkleCanvas.clientHeight/3);
  sparkleEmitter.setDirection(90);
  sparkleEmitter.setRadius(360);

  var size = sparkleCanvas.height/8;

  sparkleEmitter.drawParticle = function(x, y, particle) {
    // this.context.setTransform(0, 0, 0, 0, particle.x, particle.y);
    // this.context.rotate(sparkleEmitter.getParticleAge(particle) / 100);
    this.context.globalAlpha = Math.max(particle.opacity * Math.sin(
      (sparkleEmitter.getParticleAge(particle) + (particle.born * 10)) / 100), 0
    );
    this.context.globalCompositeOperation = 'source-over';
    this.context.drawImage(sparkleImage, x-(size/2), y-(size/2), size, size);
    return this;
  };

  function drawSparkle() {
    sparkleContext.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
    sparkleEmitter.fire();
    requestAnimationFrame(drawSparkle);
  }
  
  drawSparkle();
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

function Ability(idol, parts, animation, affinity) {
  this.strength = 0;
  this.healing = false;
  this.affinity = affinity;

  var partNames = [];

  for(var i = 0, n = parts.length; i < n; i++) {
    var part = parts[i];
    partNames.push(choice(part.words, idol.rand()));
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
  this.favourite = false;
  this.seed = seed;
  this.identifier = seed.toString(10);
  this.rand = seededRandom(seed);

  // build stats
  for(var i = 0, n = STATS.length; i < n; i++) {
    this[STATS[i]] = Math.floor(this.rand(-100, 100));
  }

  this.abilities = [];

  // build name
  this.firstName = this.generateName();
  this.lastName = this.generateName();
  this.cacheName();

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

    abilityParts.push(choice(ABILITIES[0], this.rand()));
    if (this.rand() > 0.8) abilityParts.push(choice(ABILITIES[1], this.rand()));
    abilityParts.push(choice(ABILITIES[2], this.rand()));

    this.abilities.push(new Ability(this, abilityParts, choice(ANIMATIONS, this.rand()), choice(AFFINITIES, this.rand())));
  }

  // build affinity
  this.affinity = choice(AFFINITIES, this.rand());

  this.handleOverrides();
}
Idol.prototype.generateName = function() {
  var name = '';
  var kanaCount = Math.floor(this.rand(4, 2));
  while (kanaCount > 0) {
    var targetDepth = this.rand();
    var currentDepth = 0;
    var nextKana;

    for (var ki = 0; ki < KANA.length; ki++) {
      var item = KANA[ki];
      nextKana = item[0];
      currentDepth += item[1];
      if (currentDepth >= targetDepth) {
        break;
      }
    }

    name += nextKana;
    if (this.rand() > 0.9) name += N;

    kanaCount--;
  }
  name = name[0].toUpperCase() + name.slice(1);
  return name;
};
Idol.prototype.cacheName = function() {
  this.name = [this.firstName, this.lastName].join(' ');
};
Idol.prototype.deferRendering = function(mode, callback) {
  var self = this;
  mode = mode || 'med';

  if (this.loadedImages[mode] !== undefined) return;  // we're already loading

  var loaded = 0;
  var images = [];
  this.loadedImages[mode] = images;

  function renderIfLoaded() {
    loaded++;
    if (loaded === self.parts.length) {
      if (callback !== undefined) callback();
      self.renderSprite(mode);
    }
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
  this.deferRendering(mode);
  return 'placeholder.png';
};
Idol.prototype.getThumbSprite = function() { return this.getSprite('thumb'); };
Idol.prototype.getHugeSprite = function() { return this.getSprite('huge'); };
Idol.prototype.canFeed = function() { return this.agency.canFeed(); };
Idol.prototype.renderSprite = function(mode) {
  if (mode === undefined) mode = 'med';

  var images = this.loadedImages[mode];

  var offscreenCanvasElement = document.createElement('canvas');
  var offscreenCanvas = offscreenCanvasElement.getContext('2d');

  offscreenCanvas.canvas.width = images[0].naturalWidth;
  offscreenCanvas.canvas.height = images[0].naturalHeight;

  offscreenCanvas.clearRect(0, 0, offscreenCanvas.canvas.width, offscreenCanvas.canvas.height);

  for (var i = 0; i < images.length; i++) {
    offscreenCanvas.drawImage(images[i], 0, 0);
  }

  // masking, for a fade at the bottom
  offscreenCanvas.globalCompositeOperation = 'destination-in';
  var gradient = offscreenCanvas.createLinearGradient(0, 0, 0, offscreenCanvas.canvas.height);
  gradient.addColorStop(0.9, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  offscreenCanvas.fillStyle = gradient;
  offscreenCanvas.fillRect(0, 0, offscreenCanvas.canvas.width, offscreenCanvas.canvas.height);

  var subbableImages = document.querySelectorAll('.sprite img[data-sprite-' + mode + '-id="' + this.identifier + '"]');
  var dataURL = offscreenCanvasElement.toDataURL();

  for (var si = 0; si < subbableImages.length; si++) {
    subbableImages[si].src = dataURL;
  }

  if (mode === 'thumb') {
    this.loadedThumbSprite = dataURL;
  }

  this.loadedImages[mode] = undefined;  // free up some memory?
};
Idol.prototype.spriteHTML = function(mode) {
  if (mode === undefined || typeof(mode) !== 'string') mode = 'med';
  var sprite;

  if (mode === 'med') {
    sprite = this.getSprite();
  } else if (mode === 'thumb') {
    sprite = this.loadedThumbSprite || this.getThumbSprite();
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
    this[choice(STATS, Math.random())]++;
  }

  deferRerender();
};
Idol.prototype.showDetail = function() {
  var self = this;
  currentlyShowingDetail = this;

  document.body.classList.add('overlay');
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
      var negativeStats = {};
      var summedStats = {};

      for (var i = 0; i < STATS.length; i++) {
        var stat = STATS[i];
        var increaseBy = foodIdol[stat];
        if (increaseBy < 0) {
          increaseBy /= NEGATIVE_STAT_EFFECT;
          negativeStats[stat] = true;
        }
        summedStats[stat] = self[stat] + Math.ceil(increaseBy);
      }

      canteenElement.innerHTML = canteenConfirmTemplate({
        idol: self,
        food: foodIdol,
        summedStats: summedStats,
        negativeStats: negativeStats
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
        askUser('Training successful!');
        agency.grantExperience(5);
        celebrate();
      });
    }

    var idolElements = canteenElement.querySelectorAll('.idol.enabled');

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
        hideIdolDetail();
        agency.removeIdol(self);
        var graduationBonus = choice(GRADUATION_BONUSES, Math.random());
        bonus = graduationBonus[0];
        template = graduationBonus[1];

        for (var i = 0; i < agency.catalog.length; i++) {
          agency.catalog[i].giveBonus(bonus);
        }

        askUser(
          template.replace('<idol>', self.name) +
          ' The other idols in your agency get ' + bonus.toString(10) + ' bonus stat point' + ((bonus === 1) ? '' : 's') + ' each.'
        );

        agency.grantExperience(5);
        celebrate(bonus);
        rerender();
      }],
      ['Keep', function() {}]
    ]);
  });


  detailElement.querySelector('.membership .input').addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();

    self.toggleUnitMembership();
    if (self.isInUnit() ^ e.currentTarget.classList.contains('active')) e.currentTarget.classList.toggle('active');
    deferRerender();
  });

  detailElement.querySelector('a.favourite').addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();

    self.favourite = !self.favourite;
    e.target.classList.toggle('selected');
    deferRerender();
  });
};
Idol.prototype.next = function(mod) {
  var sc = agency.sortedCatalog();
  return sc[sc.indexOf(this) + (mod || 1)];
};
Idol.prototype.prev = function() { return this.next(-1); };
Idol.prototype.audition = function() {
  var self = this;
  var layerTimeout = 400;
  var currentLayer = 0;
  var hugeImages;

  auditionSpace.innerHTML = auditionTemplate(this);
  setTimeout(function() {
    initSparkle(document.getElementById('sparkle-canvas'));
  }, 1);

  function addLayerToAuditionPortrait() {
    var portraitElement = document.querySelector('#audition .portrait');
    if (!portraitElement) return;

    var part = hugeImages[currentLayer];
    if (!part) return;

    portraitElement.appendChild(part);
    setTimeout(function() { part.classList.add('visible'); }, 1);
    currentLayer++;
    setTimeout(addLayerToAuditionPortrait, layerTimeout);
  }

  function showLayersGradually() {
    hugeImages = self.loadedImages.huge;
    setTimeout(addLayerToAuditionPortrait, layerTimeout);
  }

  setTimeout(function() {
    self.deferRendering('huge', showLayersGradually);
  }, 1);

  document.getElementById('catch-button').addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    auditionSpace.innerHTML = '';
    self.showDetail();
    agency.grantExperience(5);
  });
};
Idol.prototype.dump = function() {
  var idolDump = {
    i: this.seed,
    a: this.recruitedAt,
    f: this.favourite,
    s: [],
    b: []
  };
  for(var i = 0, n = STATS.length; i < n; i++) {
    idolDump.s.push(this[STATS[i]]);
  }
  return idolDump;
};
Idol.prototype.handleOverrides = function() {
  // look, we need _somewhere_ to hide our easter eggs
  var override = SEED_OVERRIDES[this.seed];
  if (override !== undefined) {
    override(this);
    this.seedOverride = override.overrideName;
  }
};
Idol.prototype.isShadow = function() {
  return this.seedOverride === 'shadow';
};

function hideIdolDetail(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  detailElement.classList.remove('shown');
  document.body.classList.remove('overlay');
  currentlyShowingDetail = undefined;
}
function showNextIdol() {
  if (!currentlyShowingDetail) return;
  var nextIdol = currentlyShowingDetail.next();
  if (nextIdol) nextIdol.showDetail();
}
function showPrevIdol() {
  if (!currentlyShowingDetail) return;
  var prevIdol = currentlyShowingDetail.prev();
  if (prevIdol) prevIdol.showDetail();
}
var keyHandlers = {
  ArrowLeft: showPrevIdol,
  ArrowRight: showNextIdol,
  Escape: hideIdolDetail
};

document.addEventListener('keydown', function(event) {
  handler = keyHandlers[event.key];
  if (handler) {
    event.preventDefault();
    event.stopPropagation();
    handler();
  }
});

var hammerManager = new Hammer(document.body);
hammerManager.on('swipeleft', showNextIdol);
hammerManager.on('swiperight', showPrevIdol);

function Agency() {
  this.catalog = [];
  this.unit = [];
  this.recentlyFired = [];
  this.upgrades = {};
  for (var upgradeName in upgradeNames) this.upgrades[upgradeName] = 0;

  this.sortOrder = 'date';

  this.experience = 0;
  this.storyChapter = 0;
  this.storyGeneration = 0;
  this.totalStoryChaptersBeaten = 0;

  this.storyActors = {};
}
Agency.prototype.full = function() {
  return this.catalog.length >= MAXIMUM_CATALOG_SIZE;
};
Agency.prototype.renderCatalog = function() {
  var sortedCatalog = this.sortedCatalog();

  var sortOrders = [];

  for (var key in idolSortNames) {
    var item = [key, idolSortNames[key]];
    if (this.sortOrder === key) item.isSelectedOrder = true;
    sortOrders.push(item);
  }

  sortOrders.sort();

  var upgrades = [];

  for (var upgradeName in upgradeNames) {
    upgrades.push({
      name: upgradeName,
      verboseName: upgradeNames[upgradeName].name,
      description: upgradeNames[upgradeName].description,
      currentLevel: this.upgrades[upgradeName]
    });
  }

  catalogElement.innerHTML = catalogTemplate({
    'hasNeverScannedAnything': (this.catalog.length === 0) && document.body.classList.contains('nothing-scanned'),
    'catalog': sortedCatalog,
    'hasStoryRemaining': CAMPAIGN[this.storyChapter] !== undefined,
    'canFeed': this.canFeed(),
    'levelFloor': this.levelFloor(),
    'levelProgressPercent': Math.floor(this.levelProgress() * 100),
    'spendableLevels': this.spendableLevels(),
    'upgrades': upgrades,
    'sortOrder': this.sortOrder,
    'sortOrders': sortOrders,
    'backupUrl': 'data:application/x-idol-threat-save;charset=utf-8,' + encodeURIComponent(btoa(JSON.stringify(this.dump())))
  });

  function setSortOrder(event) {
    event.stopPropagation();
    event.preventDefault();
    agency.sortOrder = event.currentTarget.getAttribute('data-sort-order');
    rerender();
  }

  document.getElementById('sort-button').addEventListener('click', function(event) {
    event.stopPropagation();
    event.preventDefault();
    document.getElementById('agency-meta').classList.remove('upgrade-visible');
    document.getElementById('agency-meta').classList.toggle('sort-visible');
  });

  document.getElementById('agency-summary').addEventListener('click', function(event) {
    event.stopPropagation();
    event.preventDefault();
    document.getElementById('agency-meta').classList.remove('sort-visible');
    document.getElementById('agency-meta').classList.toggle('upgrade-visible');
  });

  for (var sortKey in idolSortNames) {
    var sortElement = document.querySelector('#sort-list a[data-sort-order="' + sortKey + '"]');
    if (sortElement) sortElement.addEventListener('click', setSortOrder);
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

  var upgradeButtons = document.querySelectorAll('#upgrade-list a[data-upgrade-name]');

  function upgradeAgency(event) {
    event.stopPropagation();
    event.preventDefault();
    if (agency.spendableLevels() <= 0) {
      askUser('You have no points to spend. Level up your agency some more and try again later.');
      return;
    }

    var upgradeName = event.currentTarget.getAttribute('data-upgrade-name');
    agency.upgrades[upgradeName] += 1;
    event.currentTarget.querySelector('.current-level').innerText = agency.upgrades[upgradeName].toString(10);
    document.getElementById('spendable-levels').innerText = agency.spendableLevels();
    if (agency.spendableLevels() === 0) document.getElementById('agency-meta').classList.remove('spendable-levels');
    saveGame();
  }

  for (var k = 0; k < upgradeButtons.length; k++) {
    upgradeButtons[k].addEventListener('click', upgradeAgency);
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

  function triggerLoad(event) {
    event.stopPropagation();
    event.preventDefault();
    loadGame.click();
  }
  document.getElementById('load-backup').addEventListener('click', triggerLoad);
  var footerLoad = document.getElementById('footer-load');
  if (footerLoad) footerLoad.addEventListener('click', triggerLoad);
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
  var self = this;
  content = unitTemplate(this);

  if ((this.unit.length === 0) ^ unitElement.classList.contains('empty')) {
    unitElement.classList.toggle('empty');
  }

  unitElement.innerHTML = content;
  unitElements = unitElement.querySelectorAll('.unit li');

  function handleUnitClick(e) {
    e.stopPropagation();
    e.preventDefault();
    self.unit[parseInt(e.currentTarget.getAttribute('data-index'), 10)].showDetail();
  }

  for (var ei = 0; ei < unitElements.length; ei++) {
    unitElements[ei].addEventListener('click', handleUnitClick);
  }
};
Agency.prototype.level = function() {
  var level = 0;
  var xpRemainder = this.experience;
  while (xpRemainder >= level) {
    level++;
    xpRemainder -= level;
  }
  return 1 + level + (xpRemainder / level);
};
Agency.prototype.spendableLevels = function() {
  var spendableLevels = this.levelFloor();
  for (var upgradeType in this.upgrades) {
    spendableLevels -= this.upgrades[upgradeType];
  }
  return spendableLevels;
};
Agency.prototype.levelFloor = function() {
  return Math.floor(this.level());
};
Agency.prototype.levelProgress = function() {
  var level = this.level();
  return level - Math.floor(level);
};
Agency.prototype.grantExperience = function(count) {
  this.experience += count;
  deferRerender();
  if (!count) return;  // we don't need to congratulate them on this one i don't think

  var indicator = document.createElement('div');
  indicator.classList.add('xp-indicator');
  indicator.innerHTML = count.toString(10) + 'xp';
  indicator.style.left = ((Math.random() * 60) - 30).toString(10) + '%';
  xpIndicatorsElement.appendChild(indicator);

  setTimeout(function() {
    xpIndicatorsElement.removeChild(indicator);
  }, 4000);
};
Agency.prototype.unitName = function() {
  var unitSeed = 0;

  for (var ii = 0; ii < this.unit.length; ii++) {
    unitSeed += this.unit[ii].seed;
  }
  
  var rng = seededRandom(unitSeed);
  return choice(choice(UNIT_NAMES[0], rng()), rng()) + ' ' + choice(choice(UNIT_NAMES[1], rng()), rng());
};
Agency.prototype.addIdol = function(idol, interactive) {
  if ((this.catalog.length === 0) && document.body.classList.contains('nothing-scanned')) {
    document.body.removeChild(document.getElementById('title'));
    document.body.classList.remove('nothing-scanned');
  }

  for(var i = 0, n = this.catalog.length; i < n; i++) {
    if (this.catalog[i].seed === idol.seed) {
      var catalogIdol = this.catalog[i];
      askUser("You recruited this idol already; it's " + idol.name + "!",
        [
          ['Show me', catalogIdol.showDetail.bind(catalogIdol)],
          ['Okay', null]
        ]
      );
      return;
    }
  }

  if (this.recentlyFired.indexOf(idol.seed) !== -1) {
    askUser(idol.name + " recently left your agency. Try recruiting some other idols before attempting to recruit her again.");
    return;
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
  if (idol.isInUnit()) idol.toggleUnitMembership();
  agency.catalog.splice(agency.catalog.indexOf(idol), 1);

  agency.recentlyFired.push(idol.seed);
  if (agency.recentlyFired.length > RECENT_FIRING_MEMORY) {
    agency.recentlyFired = agency.recentlyFired.splice(
      agency.recentlyFired.length - RECENT_FIRING_MEMORY,
      RECENT_FIRING_MEMORY
    );
  }

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
  var letterTimeout;
  var actorElement;

  function graduallyShowScript(visibleScriptElement, invisibleScriptElement) {
    function showNextLetter() {
      var nextLetter = invisibleScriptElement.textContent[0];
      visibleScriptElement.textContent += nextLetter;
      invisibleScriptElement.textContent = invisibleScriptElement.textContent.replace(/^./, '');

      if (invisibleScriptElement.textContent) {
        var letterDelay = LETTER_DELAY * (LETTER_DELAYS[nextLetter] || 1);
        if (page.em) letterDelay *= LETTER_EMPHASIS_MULTIPLIER;
        letterTimeout = setTimeout(showNextLetter, letterDelay);
      } else {
        letterTimeout = undefined;
      }
    }

    letterTimeout = setTimeout(showNextLetter, 50);

    function handleScriptClick(e) {
      e.stopPropagation();
      e.preventDefault();

      if (letterTimeout === undefined) {
        theatreElement.removeEventListener('click', handleScriptClick);
        self.doStory(pageNumber + 1);
      } else {
        clearTimeout(letterTimeout);
        letterTimeout = undefined;
        visibleScriptElement.textContent += invisibleScriptElement.textContent;
        invisibleScriptElement.textContent = '';
      }
    }
    theatreElement.addEventListener('click', handleScriptClick);
  }

  function renderSetting() {
    theatreElement.innerHTML = theatreTemplate({background: self.storySetting});
    theatreElement.querySelector('#skip').addEventListener('click', function(event) {
      event.stopPropagation();
      event.preventDefault();
      isSkipping = true;
      self.doStory(pageNumber + 1);
    });
  }

  function goToDestination() {
    if (page.adjectives.into) actorElement.setAttribute('data-position', page.adjectives.into);
  }

  if (page === undefined) {
    theatreElement.innerHTML = '';
    this.storyChapter++;
    this.totalStoryChaptersBeaten++;
    this.grantExperience(this.totalStoryChaptersBeaten);
    rerender();
  } else if (page.kind === 'setting') {
    this.storySetting = page.value;
    renderSetting();
    this.doStory(pageNumber + 1);
  } else if (page.kind === 'text') {
    if (!theatreElement.innerHTML) renderSetting();
    if (theatreElement.classList.contains('em') !== Boolean(page.em)) theatreElement.classList.toggle('em');

    var currentlySpeakingIdolElements = theatreElement.querySelectorAll('.speaking');
    for (var ci = 0; ci < currentlySpeakingIdolElements.length; ci++) currentlySpeakingIdolElements[ci].classList.remove('speaking');

    if (isSkipping) {
      this.doStory(pageNumber + 1);
    } else {
      var invisibleScriptElement = document.getElementById('invisible-script');
      var visibleScriptElement = document.getElementById('visible-script');
      for (var psi = 0; psi < page.speakers.length; psi++) {
        theatreElement.querySelector('[data-actor-name="' + page.speakers[psi] + '"]').classList.add('speaking');
      }
      invisibleScriptElement.textContent = page.text;
      visibleScriptElement.textContent = '';
      graduallyShowScript(visibleScriptElement, invisibleScriptElement);
    }
  } else if (page.kind === 'direction') {
    if (page.actor !== undefined) {
      var actor = getBoss(page.actor);
      actorElement = theatreElement.querySelector('#boards .actor[data-actor-name="' + page.actor + '"]');
      if (!actorElement) {
        actor.actorName = page.actor;
        actorElement = document.createElement('div');
        actorElement.setAttribute('data-actor-name', page.actor);
        actorElement.classList.add('actor');
        actorElement.innerHTML = actor.hugeSpriteHTML();
        theatreElement.querySelector('#boards').appendChild(actorElement);
      }
      actorElement.classList.remove('exited');

      if (page.adjectives.rotated) actorElement.setAttribute('data-rotated', page.adjectives.rotated);

      if (page.verb === 'enter' && page.adjectives.from) {
        actorElement.setAttribute('data-position', page.adjectives.from + '-offstage');
        setTimeout(goToDestination, 10);
      } else {
        goToDestination();
      }
    }
    if (page.verb === 'celebrate') celebrate();
    if (page.verb === 'clear') {
      var actorElements = theatreElement.querySelectorAll('#boards .actor');
      for (var aei = 0; aei < actorElements.length; aei++) actorElements[aei].classList.add('exited');
    }

    this.doStory(pageNumber + 1);
  } else if (page.kind === 'battle') {
    isSkipping = false;
    theatreElement.innerHTML = '';
    var playerIdols = [];

    for (var pi = 0; pi < self.unit.length; pi++) {
      playerIdols.push(new BattleIdol(self.unit[pi], 'player'));
    }

    var enemyIdols = [];

    for (var ei = 0; ei < page.bosses.length; ei++) {
      var enemyIdol = getBoss(page.bosses[ei]);
      for (var si = 0; si < STATS.length; si++) {
        enemyIdol[STATS[si]] = enemyIdol[STATS[si]] + page.strength + (
          PRESTIGE_DIFFICULTY_INCREASE * agency.storyGeneration);
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
    x: this.experience,
    p: this.upgrades,
    c: this.storyChapter,
    g: this.storyGeneration,
    b: this.totalStoryChaptersBeaten,
    f: this.recentlyFired,
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
  this.experience = agencyDump.x || 0;
  this.storyChapter = agencyDump.c || 0;
  this.storyGeneration = agencyDump.g || 0;
  this.totalStoryChaptersBeaten = agencyDump.b || 0;
  this.recentlyFired = agencyDump.f || [];
  this.upgrades = agencyDump.p || this.upgrades;

  for(var i = 0, n = agencyDump.i.length; i < n; i++) {
    var idolDump = agencyDump.i[i];
    var idol = new Idol(idolDump.i);

    idol.recruitedAt = idolDump.a;
    idol.favourite = idolDump.f;

    for(var si = 0, sn = STATS.length; si < sn; si++) {
      idol[STATS[si]] = idolDump.s[si];
    }

    this.addIdol(idol);

    if (Boolean(agencyDump.u[i]) !== idol.isInUnit()) {
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
  barcodeImage.value = '';

  if ((!data) || (!data.codeResult)) {
    askUser(
      "Sorry, we couldn't read a barcode in that picture, please try a clearer photo.",
      [
        ['Try again', function() { barcodeImage.click(); }],
        ['Cancel', null]
      ]
    );
    return;
  }
  idol = new Idol(numFromString(data.codeResult.code));
  agency.addIdol(idol, true);
}

barcodeImage.addEventListener('change', function(e) {
  if (agency.full()) {
    askUser(CATALOG_FULL);
    return;
  }

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

function complainAboutBadSaveFile() {
  askUser("We couldn't load this save file, sorry. Try another one, or perhaps send us the file and we'll see if we can help.");
}

loadGame.addEventListener('change', function(e) {
  var reader = new FileReader();
  reader.onload = function() {
    var newAgency = new Agency();

    newAgency.load(JSON.parse(atob(reader.result)));
    // try {
    //   newAgency.load(JSON.parse(atob(reader.result)));
    // } catch (e) {
    //   complainAboutBadSaveFile();
    //   console.log(e);
    //   return;
    // }

    askUser('Loaded save successfully!');
    agency = newAgency;
    rerender();
  };

  reader.onerror = complainAboutBadSaveFile;
  var file = loadGame.files[0];
  reader.readAsText(file, 'ascii');
  loadGame.value = '';
});

var agency = new Agency();

function rerender() {
  if (document.body.classList.contains('in-battle')) return;  // there's no need to rerender when in battle

  agency.renderCatalog();
  agency.renderUnit();

  document.getElementById('recruit').addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();

    if (agency.full()) askUser(CATALOG_FULL);
    else barcodeImage.click();
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

      var battle = new Battle(playerIdols, enemyIdols, function(battle) {
        askUser('You win! Your unit gets bonuses~', [['Yay!', null]]);

        var experienceGained = 0;

        experienceGained += 5 * (maxUnitSize - battle.playerIdols.length);

        if (battle.numberOfLivingMembers(battle.playerIdols) === battle.playerIdols.length) {
          experienceGained += 2;
        }

        agency.grantExperience(experienceGained);

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
      isSkipping = false;
      agency.doStory();
    } else {
      askUser('You need an idol in your unit to progress in the story.');
    }
  });

  var prestigeButton = document.getElementById('prestige-story');
  if (prestigeButton) prestigeButton.addEventListener('click', function(e) {
    askUser('Do you want to reset story progress and make it harder? Your idols will stay with you.', [
      ['I am ready', function() {
        agency.storyGeneration++;
        agency.storyChapter = 0;
        rerender();
        agency.doStory();
      }],
      ['Not yet', null]
    ]);
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

  clearTimeout(checkSaveTimeout);
  checkSaveTimeout = setTimeout(function() {
    if (fullStateString !== getStateCookie()) {
      console.log(fullStateString);
      console.log(getStateCookie());
      askUser('saving failed! this is a bug, so im not sure what to recommend');
    }
  }, 50);
}

function deferRerender() {
  clearTimeout(rerenderTimeout);
  rerenderTimeout = setTimeout(rerender, 50);
}

function initGame() {
  FastClick.attach(document.body);
  document.getElementById('loading').innerText = '';
  parsePresetBarcodes();

  try {
    var savedStateString = getStateCookie();
    if (!!savedStateString) {
      var agencyDump = JSON.parse(savedStateString);
      agency.load(agencyDump);
    }
  } catch (e) {
    console.log(e);
    askUser('Your save game failed to load, sorry; try reloading somewhere with a better network connection, maybe? :<');
  }

  rerender();
}


function iconHTML(idol) {
  return '<div class="icon-container affinity-' + idol.affinity + '"><div class="portrait">' + idol.hugeSpriteHTML() + '</div></div>';
}

var batchMatch = window.location.hash.match(/#batch-(\d+)/);

if (batchMatch) {
  document.body.classList.remove('nothing-scanned');
  document.body.innerHTML = '';

  var batchCount = parseInt(batchMatch[1], 10);
  var batchElement = document.createElement('div');

  for (var bi = batchCount; bi > 0; bi--) {
    var thisIdol = new Idol(Math.random());
    var thisIdolElement = document.createElement('div');
    thisIdolElement.innerHTML = iconHTML(thisIdol);
    batchElement.appendChild(thisIdolElement);
  }

  document.body.appendChild(batchElement);
  document.body.classList.add('batch');
} else if (window.location.hash === '#icon') {
  var iconIdol = new Idol(Math.random());
  document.body.classList.remove('nothing-scanned');
  document.body.innerHTML = iconHTML(iconIdol);
  document.body.classList.add('icon');
} else {
  document.addEventListener('DOMContentLoaded', function() {
    initGame();
    // document.getElementById('fight').click();
    // document.getElementById('progress-story').click();
    // agency.addIdol(new Idol(Math.random()), true);
  });
}
