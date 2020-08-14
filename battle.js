var SAME_TYPE_ATTACK_BONUS = 1.5;
var SUPER_EFFECTIVE_ATTACK_BONUS = 2;
var BASIC_ABILITY_DAMAGE = 15;

var animationDuration = 1000;
var anims = {};

var hoverDetailTimeout;

function loadAnimations() {
  for(var i = 0; i < ANIMATIONS.length; i++) {
    var name = ANIMATIONS[i];
    var img = new Image();
    img.src = 'anim/' + name;
    anims[name] = img;
  }
}

loadAnimations();

function assertIsAffinity(affinity) {
  if (AFFINITIES.indexOf(affinity) === -1) {
    console.log(affinity);
    throw 'that is not an affinity';
  }
}

function effectiveness(attackAffinity, targetAffinity) {
  assertIsAffinity(attackAffinity);
  assertIsAffinity(targetAffinity);
  attackIndex = AFFINITIES.indexOf(attackAffinity);
  targetIndex = AFFINITIES.indexOf(targetAffinity);
  var effectivenessIdentifier = ((attackIndex + AFFINITIES.length) - targetIndex) % 3;
  return {
    0: 1,  // the attack is the same type as the defense
    1: SUPER_EFFECTIVE_ATTACK_BONUS, // the attack is strong
    2: 1/SUPER_EFFECTIVE_ATTACK_BONUS // the attack is weak
  }[effectivenessIdentifier];
}

function BattleIdol(idol, control) {
  var self = this;

  self.isDead = false;

  if (control === 'ai') {
    this.playerControlled = false;
  } else if (control == 'player') {
    this.playerControlled = true;
  } else {
    throw 'you need to specify a control mode for a BattleIdol';
  }

  self.idol = idol;
  this.thumbSpriteHTML = idol.thumbSpriteHTML();

  var statModifier = 1.01;
  function modStat(stat, mod) {
    return Math.ceil(mod * Math.pow(statModifier, stat));
  }

  self.attack = modStat(idol.effective.attack(), 100);
  self.defense = modStat(idol.effective.defense(), 100);
  self.speed = modStat(idol.effective.speed(), 20);

  self.maxHp = 50;
  self.hp = self.maxHp;

  self.abilities = idol.abilities;
  self.affinity = idol.affinity;
}

BattleIdol.prototype.doDamage = function(damage) {
  var self = this;
  if (this.isDead) return;
  this.hp = this.hp - damage;

  if (this.hp <= 0) {
    this.isDead = true;
    this.hp = 0;

    setTimeout(function() {
      self.element.classList.add('dead');
      if (!self.playerControlled) agency.grantExperience(1);
    }, animationDuration);
  }
  this.element.querySelector('.health-bar-content').style.width = this.healthPercent().toString(10) + '%';
  this.element.querySelector('.health-bar-trail').style.width = this.healthPercent().toString(10) + '%';
};

BattleIdol.prototype.doMove = function(moveIndex, target) {
  var self = this;
  self.element.classList.add('fighting');

  ability = self.abilities[moveIndex];

  var baseStrength = (this.attack / target.defense) * BASIC_ABILITY_DAMAGE;
  var abilityStrength = baseStrength + ((baseStrength/5) * ability.strength);

  if (ability.affinity === self.affinity) {
    abilityStrength = abilityStrength * SAME_TYPE_ATTACK_BONUS;
  }

  abilityStrength = abilityStrength * effectiveness(ability.affinity, target.affinity);
  abilityStrength = Math.ceil(abilityStrength);

  target.doDamage(abilityStrength);
  console.log(this.idol.name + ' did ' + abilityStrength.toString(10) + ' damage to ' + target.idol.name + ', bringing her HP to ' + target.hp.toString(10) + '/' + target.maxHp.toString(10));

  playAnimationCanvas(self.abilities[moveIndex].animation, target.element);

  setTimeout(function() {
    self.element.classList.remove('fighting');
    self.battle.nextMove();
  }, animationDuration);
};

BattleIdol.prototype.healthPercent = function() {
  return (this.hp / this.maxHp) * 100;
};

BattleIdol.prototype.healthBar = function() {
  return healthBarTemplate(this);
};

function Battle(playerIdols, enemyIdols, victoryCallback, lossCallback, fleeCallback) {
  this.playerIdols = playerIdols;
  this.enemyIdols = enemyIdols;

  this.victoryCallback = victoryCallback;
  this.lossCallback = lossCallback;
  this.fleeCallback = fleeCallback;

  this.render();

  document.body.classList.add('in-battle');
}

Battle.prototype.loop = function() {
  this.turnOrder = [];

  Array.prototype.push.apply(this.turnOrder, this.playerIdols);
  Array.prototype.push.apply(this.turnOrder, this.enemyIdols);

  this.turnOrder.sort(function(a, b) {
    return b.speed - a.speed;
  });

  for (var i = 0; i < this.turnOrder.length; i++) {
    this.turnOrder[i].battle = this;
  }

  this.nextMove();
};

Battle.prototype.hide = function() {
  document.body.classList.remove('in-battle');
};

Battle.prototype.flee = function() {
  this.hide();

  if (this.fleeCallback) {
    this.fleeCallback();
  } else {
    askUser('You ran away.');
  }
};

Battle.prototype.determinePlayerMove = function(idol) {
  var self = this;
  var abilityPromptElement = document.getElementById('ability-prompt');

  function pickMove(e) {
    e.stopPropagation();
    e.preventDefault();

    var targetInput = document.querySelector('input[name="target"]:checked');
    var moveInput = document.querySelector('input[name="move"]:checked');
    if ((!targetInput) || (!moveInput)) {
      askUser('You have to pick both a target and a move');
      return;
    }

    document.getElementById('battle-form').removeEventListener('submit', pickMove);

    targetIndex = parseInt(targetInput.getAttribute('value'), 10);
    abilityIndex = parseInt(moveInput.getAttribute('value'), 10);

    abilityPromptElement.innerHTML = '';
    idol.element.classList.remove('focussed');
    targetInput.checked = false;
    abilityPromptElement.innerHTML = '';
    idol.doMove(abilityIndex, self.enemyIdols[targetIndex]);
  }

  idol.element.classList.add('focussed');
  abilityPromptElement.innerHTML = abilityPromptTemplate(idol);

  document.getElementById('battle-form').addEventListener('submit', pickMove);
  document.getElementById('flee').addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    self.flee();
  });

  return;
};

Battle.prototype.tookDamage = function(team) {
  for (var i = 0; i < team.length; i++) {
    if (team[i].hp !== team[i].maxHp) return true;
  }
  return false;
};

Battle.prototype.stillHasLivingMembers = function(team) {
  return this.numberOfLivingMembers(team) > 0;
};

Battle.prototype.numberOfLivingMembers = function(team) {
  var livingMemberCount = 0;

  for (var i = 0; i < team.length; i++) {
    if (!team[i].isDead) livingMemberCount++;
  }

  return livingMemberCount;
};

Battle.prototype.playerHasWon = function() {
  return (!this.stillHasLivingMembers(this.enemyIdols));
};

Battle.prototype.enemyHasWon = function() {
  return (!this.stillHasLivingMembers(this.playerIdols));
};

Battle.prototype.nextMove = function() {
  var self = this;

  if ((this.turnIndex === undefined) || (this.turnOrder[this.turnIndex] === undefined)) {
    this.turnIndex = 0;
  }

  var idol = this.turnOrder[this.turnIndex];

  if (this.playerHasWon() || this.enemyHasWon()) {
    setTimeout(function() {
      self.hide();

      if (self.playerHasWon()) {
        celebrate(self.numberOfLivingMembers(self.playerIdols));
        self.victoryCallback(self);
      } else if (self.enemyHasWon()) {
        self.lossCallback(self);
      }

    }, animationDuration);
    return;
  }

  this.turnIndex += 1;

  if (idol.isDead) {
    this.nextMove();
  } else if (!idol.playerControlled) {
    var livingPlayerIdols = [];
    for (var i = 0; i < this.playerIdols.length; i++) {
      if (!this.playerIdols[i].isDead) livingPlayerIdols.push(this.playerIdols[i]);
    }

    idol.doMove(
      Math.floor(Math.random() * idol.abilities.length),
      livingPlayerIdols[Math.floor(Math.random() * livingPlayerIdols.length)]
    );
  } else {
    this.determinePlayerMove(idol);
  }
};

function bindHoverDetail(idol, idolElement) {
  var showing = false;
  var deetsSpace = document.getElementById('deets-space');

  function showHoverDetail() {
    if (showing) return;

    if (idol.playerControlled) {
      deetsSpace.classList.add('player');
      deetsSpace.classList.remove('enemy');
    } else {
      deetsSpace.classList.remove('player');
      deetsSpace.classList.add('enemy');
    }

    deetsSpace.setAttribute('data-affinity', idol.idol.affinity);
    deetsSpace.innerHTML = idolDeetsTemplate(idol);
    deetsSpace.classList.add('visible');
  }

  function showHoverDetailSoon() {
    clearTimeout(hoverDetailTimeout);
    hoverDetailTimeout = setTimeout(showHoverDetail, 300);
  }

  function hideHoverDetail() {
    clearTimeout(hoverDetailTimeout);
    deetsSpace.classList.remove('visible');
  }

  var startEvents = ['touchenter', 'touchstart', 'mouseenter'];
  for (var si = 0; si < startEvents.length; si++) idolElement.addEventListener(startEvents[si], showHoverDetailSoon);

  var endEvents = ['touchleave', 'touchend', 'touchcancel', 'mouseleave', 'click'];
  for (var ei = 0; ei < endEvents.length; ei++) idolElement.addEventListener(endEvents[ei], hideHoverDetail);

  idolElement.addEventListener('contextmenu', function(e) { e.preventDefault(); e.stopPropagation(); });
}

Battle.prototype.render = function() {
  battleElement.innerHTML = battleTemplate(this);

  var playerIdolElements = battleElement.querySelectorAll('#player-idols > li');
  for (var pi = 0; pi < this.playerIdols.length; pi++) {
    this.playerIdols[pi].element = playerIdolElements[pi];
    bindHoverDetail(this.playerIdols[pi], playerIdolElements[pi]);
  }

  var enemyIdolElements = battleElement.querySelectorAll('#enemy-idols > li');
  for (var ei = 0; ei < this.enemyIdols.length; ei++) {
    this.enemyIdols[ei].element = enemyIdolElements[ei];
    bindHoverDetail(this.enemyIdols[ei], enemyIdolElements[ei]);
  }
};

function playAnimationCanvas(animationName, element) {
  var portraitDiv = element.querySelector('.portrait');

  var currentImage = 0;

  var animationCanvas = document.createElement('Canvas');
  animationCanvas.style.position = "absolute";
  animationCanvas.style.display = "inline";
  animationCanvas.style.left = 2;
  animationCanvas.style.zIndex = 3;

  var ctx = animationCanvas.getContext('2d');
  portraitDiv.appendChild(animationCanvas);

  ctx.canvas.width = 256;
  ctx.canvas.height = 256;

  var animationID = setInterval(function () {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(anims[animationName], 0, (-256 * currentImage));
    currentImage++;
  }, (animationDuration / 14));

  setTimeout(function () {
    clearInterval(animationID);

    portraitDiv.removeChild(animationCanvas);
  }, animationDuration);
}
