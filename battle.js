var animationDuration = 1000;
var anims = {};

for(var i = 0; i < ANIMATIONS.length; i++) {
  var name = ANIMATIONS[i];
  var img = new Image();
  img.src = 'anim/' + name;
  anims[name] = img;
}

function BattleIdol(idol, control) {
  var self = this;
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

  self.attack = modStat(idol.attack, 100);
  self.defense = modStat(idol.defense, 50);
  self.endurance = modStat(idol.endurance, 100);
  self.speed = modStat(idol.speed, 20);

  self.maxHp = self.endurance;
  self.hp = self.maxHp;

  self.abilities = idol.abilities;
}

BattleIdol.prototype.doDamage = function(damage) {
  this.hp = this.hp - damage;
  this.element.querySelector('.health-bar-content').style.width = this.healthPercent().toString(10) + '%';
  this.element.querySelector('.health-bar-trail').style.width = this.healthPercent().toString(10) + '%';
};

BattleIdol.prototype.doMove = function(moveIndex, target) {
  var self = this;
  self.element.classList.add('fighting');

  target.doDamage(50);

  playAnimationCanvas(self.abilities[moveIndex].animation, target.element);

  setTimeout(function() {
    self.element.classList.remove('fighting');
  }, animationDuration);
};

BattleIdol.prototype.healthPercent = function() {
  return (this.hp / this.maxHp) * 100;
};

BattleIdol.prototype.healthBar = function() {
  return healthBarTemplate(this);
};

function Battle(playerIdols, enemyIdols) {
  this.playerIdols = playerIdols;
  this.enemyIdols = enemyIdols;

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

  this.pickedMoves = {};
  this.pickedTargets = {};
  this.determineMoves();
};

Battle.prototype.determinePlayerMoves = function() {
  // this has to be recursive because it's dependent on player activity
  var i;
  var idol;
  var self = this;
  var abilityPromptElement = document.getElementById('ability-prompt');

  function pickMove(e) {
    e.stopPropagation();
    e.preventDefault();
    document.getElementById('battle-form').removeEventListener('submit', pickMove);
    var targetInput = document.querySelector('input[name="target"]:checked');
    targetIndex = parseInt(targetInput.getAttribute('value'), 10);
    abilityIndex = parseInt(document.querySelector('input[name="move"]:checked').getAttribute('value'), 10);

    self.pickedMoves[i] = abilityIndex;
    self.pickedTargets[i] = self.enemyIdols[targetIndex];
    abilityPromptElement.innerHTML = '';
    idol.element.classList.remove('focussed');
    targetInput.checked = false;

    self.determinePlayerMoves();
  }

  for (i = 0; i < this.turnOrder.length; i++) {
    if (!(i in this.pickedMoves)) {
      idol = this.turnOrder[i];
      idol.element.classList.add('focussed');
      abilityPromptElement.innerHTML = abilityPromptTemplate(idol);

      document.getElementById('battle-form').addEventListener('submit', pickMove);

      return;
    }
  }

  abilityPromptElement.innerHTML = '';
  this.executeMoves(0);
};

Battle.prototype.determineMoves = function() {
  for (var i = 0; i < this.turnOrder.length; i++) {
    var idol = this.turnOrder[i];
    if (!idol.playerControlled) {
      this.pickedMoves[i] = Math.floor(Math.random() * idol.abilities.length);
      this.pickedTargets[i] = this.playerIdols[Math.floor(Math.random() * this.playerIdols.length)];
    }
  }
  this.determinePlayerMoves();
};

Battle.prototype.executeMoves = function(index) {
  var self = this;

  if (self.turnOrder[index] === undefined) {
    self.loop();
    return;
  }

  self.turnOrder[index].doMove(self.pickedMoves[index], self.pickedTargets[index]);

  setTimeout(function() {
    self.executeMoves(index+1);
  }, animationDuration);
};

Battle.prototype.render = function() {
  battleElement.innerHTML = battleTemplate(this);

  var playerIdolElements = battleElement.querySelectorAll('#player-idols > li');
  for (var pi = 0; pi < this.playerIdols.length; pi++) {
    this.playerIdols[pi].element = playerIdolElements[pi];
  }

  var enemyIdolElements = battleElement.querySelectorAll('#enemy-idols > li');
  for (var ei = 0; ei < this.enemyIdols.length; ei++) {
    this.enemyIdols[ei].element = enemyIdolElements[ei];
  }
};

function playAnimationCanvas(animationName, element) {
  var portraitDiv = element.querySelector('.portrait');

  var currentImage = 0;

  var animationCanvas = document.createElement('Canvas');
  animationCanvas.style.position = "absolute";
  animationCanvas.style.display = "inline";
  animationCanvas.style.left = 2;
  animationCanvas.style.zIndex = 2;

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
