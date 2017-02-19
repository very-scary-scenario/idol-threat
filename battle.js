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

  function pickMove(e) {
    e.stopPropagation();
    e.preventDefault();
    abilityIndex = parseInt(e.currentTarget.getAttribute('data-index'), 10);
    self.pickedMoves[i] = abilityIndex;
    abilityPromptElement.innerHTML = '';
    idol.element.classList.remove('focussed');
    self.determinePlayerMoves();
  }

  for (i = 0; i < this.turnOrder.length; i++) {
    if (!(i in this.pickedMoves)) {
      idol = this.turnOrder[i];
      idol.element.classList.add('focussed');
      abilityPromptElement.innerHTML = abilityPromptTemplate(idol);

      var abilityButtons = abilityPromptElement.querySelectorAll('a[data-index]');
      for (var ai = 0; ai < abilityButtons.length; ai++) {
        abilityButtons[ai].addEventListener('click', pickMove);
      }

      return;
    }
  }

  this.executeMove(0);
};

Battle.prototype.determineMoves = function() {
  for (var i = 0; i < this.turnOrder.length; i++) {
    var idol = this.turnOrder[i];
    if (!idol.playerControlled) {
      this.pickedMoves[i] = Math.floor(Math.random() * idol.abilities.length);
      this.pickedTargets[i] = Math.floor(Math.random() * this.playerIdols.length);
    }
  }
  this.determinePlayerMoves();
};

Battle.prototype.executeMove = function(index) {
  console.log(this.turnOrder);
  console.log(this.pickedMoves);
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

function playAnimation(folderName, imagesCount, totalPlayTime, elemID) {
  var div = document.getElementById(elemID);

  var currentImage = 1;
  var animationID = setInterval(function () {
    div.innerHTML = ('<img src="' +folderName +'/' +currentImage +'.png" />');
    currentImage++;
  }, (totalPlayTime / imagesCount));

  setTimeout(function () {
    clearInterval(animationID);

    div.innerHTML = '';
  }, totalPlayTime);
}

function playAnimationCanvas(animationName, totalPlayTime, elemID) {
  var div = document.getElementById(elemID);
  var portraitDiv = div.querySelector('.battle-portrait');

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
  }, (totalPlayTime / 14));

  setTimeout(function () {
    clearInterval(animationID);

    portraitDiv.removeChild(animationCanvas);
  }, totalPlayTime);
}
