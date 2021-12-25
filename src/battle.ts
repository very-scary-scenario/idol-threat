import * as Handlebars from 'handlebars'
import {
  ANIMATIONS,
} from './parts'
import { askUser } from './util'
import { Ability, Idol } from './game'

export enum Affinity { rock, paper, scissors }
export type AffinityType = keyof typeof Affinity
export const AFFINITIES: AffinityType[] = ['rock', 'paper', 'scissors']

var battleElement = document.getElementById('battle')!;

var abilityPromptTemplate = Handlebars.compile(document.getElementById('ability-prompt-template')!.innerHTML);
var battleTemplate = Handlebars.compile(document.getElementById('battle-template')!.innerHTML);
var healthBarTemplate = Handlebars.compile(document.getElementById('health-bar-template')!.innerHTML);
var idolDeetsTemplate = Handlebars.compile(document.getElementById('idol-deets-template')!.innerHTML);

var SAME_TYPE_ATTACK_BONUS = 1.5;
var SUPER_EFFECTIVE_ATTACK_BONUS = 2;
var BASIC_ABILITY_DAMAGE = 15;

var animationDuration = 1000;
var anims = new Map<string, HTMLImageElement>()

var hoverDetailTimeout: number;

function loadAnimations() {
  for(var i = 0; i < ANIMATIONS.length; i++) {
    var name = ANIMATIONS[i];
    var img = new Image();
    img.src = name;
    anims.set(name, img);
  }
}

loadAnimations();

function effectiveness(attackAffinity: AffinityType, targetAffinity: AffinityType) {
  var attackIndex = AFFINITIES.indexOf(attackAffinity);
  var targetIndex = AFFINITIES.indexOf(targetAffinity);
  var effectivenessIdentifier = ((attackIndex + AFFINITIES.length) - targetIndex) % 3;
  return {
    0: 1,  // the attack is the same type as the defense
    1: SUPER_EFFECTIVE_ATTACK_BONUS, // the attack is strong
    2: 1/SUPER_EFFECTIVE_ATTACK_BONUS // the attack is weak
  }[effectivenessIdentifier];
}

export class BattleIdol {
  isDead = false
  idol: Idol
  playerControlled: boolean
  thumbSpriteHTML: string
  attack: number
  defense: number
  speed: number
  maxHp: number
  hp: number
  abilities: Ability[]
  affinity: AffinityType
  battle?: Battle
  element?: Element

  constructor(idol: Idol, control: 'ai' | 'player') {
    this.idol = idol

    if (control === 'ai') {
      this.playerControlled = false;
    } else if (control == 'player') {
      this.playerControlled = true;
    } else {
      throw 'you need to specify a control mode for a BattleIdol';
    }

    this.thumbSpriteHTML = idol.thumbSpriteHTML();
    var statModifier = 1.01;
    function modStat(stat: number, mod: number) {
      return Math.ceil(mod * Math.pow(statModifier, stat));
    }

    this.attack = modStat(idol.effective.get('attack')!(), 100);
    this.defense = modStat(idol.effective.get('defense')!(), 100);
    this.speed = modStat(idol.effective.get('speed')!(), 20);

    this.maxHp = 50;
    this.hp = this.maxHp;

    this.abilities = idol.abilities;
    this.affinity = idol.affinity;
  }

  doDamage(damage: number) {
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

  doMove(moveIndex: number, target: BattleIdol) {
    var self = this;
    self.element.classList.add('fighting');

    var ability = self.abilities[moveIndex];

    var baseStrength = (this.attack / target.defense) * BASIC_ABILITY_DAMAGE;
    var abilityStrength = baseStrength + ((baseStrength/5) * ability.strength);

    if (ability.affinity === self.affinity) {
      abilityStrength = abilityStrength * SAME_TYPE_ATTACK_BONUS;
    }

    abilityStrength = abilityStrength * effectiveness(ability.affinity, target.affinity);
    abilityStrength = Math.ceil(abilityStrength);

    target.doDamage(abilityStrength);
    console.log(this.idol.name + ' did ' + abilityStrength.toString(10) + ' damage to ' + target.idol.name + ', bringing her HP to ' + target.hp.toString(10) + '/' + target.maxHp.toString(10));

    playAnimationCanvas(self.abilities[moveIndex], target.element);

    setTimeout(function() {
      self.element.classList.remove('fighting');
      self.battle.nextMove();
    }, animationDuration);
  };

  healthPercent(): number {
    return (this.hp / this.maxHp) * 100;
  };

  healthBar(): string {
    return healthBarTemplate(this, {allowedProtoMethods: {healthPercent: true}});
  };
}

export class Battle {
  playerIdols: BattleIdol[]
  enemyIdols: BattleIdol[]
  victoryCallback: (arg0: Battle) => void
  lossCallback: (arg0: Battle) => void
  fleeCallback: (arg0: Battle) => void
  turnOrder: BattleIdol[]

  constructor(
    playerIdols: BattleIdol[],
    enemyIdols: BattleIdol[],
    victoryCallback: (arg0: Battle) => void,
    lossCallback: (arg0: Battle) => void,
    fleeCallback: (arg0: Battle) => void
  ) {
    this.playerIdols = playerIdols;
    this.enemyIdols = enemyIdols;

    this.victoryCallback = victoryCallback;
    this.lossCallback = lossCallback;
    this.fleeCallback = fleeCallback;

    this.render();

    document.body.classList.add('in-battle');

    this.turnOrder = [];
  }

  loop() {
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

  hide() {
    document.body.classList.remove('in-battle');
  };

  flee() {
    this.hide();

    if (this.fleeCallback) {
      this.fleeCallback();
    } else {
      askUser('You ran away.');
    }
  };

  determinePlayerMove(idol: BattleIdol) {
    var self = this;
    var abilityPromptElement = document.getElementById('ability-prompt')!;

    function pickMove(e: Event) {
      e.stopPropagation();
      e.preventDefault();

      var targetInput = document.querySelector('input[name="target"]:checked');
      var moveInput = document.querySelector('input[name="move"]:checked');
      if ((!targetInput) || (!moveInput)) {
        askUser('You have to pick both a target and a move');
        return;
      }

      document.getElementById('battle-form')!.removeEventListener('submit', pickMove);

      var targetIndex = parseInt(targetInput.getAttribute('value')!, 10);
      var abilityIndex = parseInt(moveInput.getAttribute('value')!, 10);

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

  tookDamage(team) {
    for (var i = 0; i < team.length; i++) {
      if (team[i].hp !== team[i].maxHp) return true;
    }
    return false;
  };

  stillHasLivingMembers(team) {
    return this.numberOfLivingMembers(team) > 0;
  };

  numberOfLivingMembers(team) {
    var livingMemberCount = 0;

    for (var i = 0; i < team.length; i++) {
      if (!team[i].isDead) livingMemberCount++;
    }

    return livingMemberCount;
  };

  playerHasWon() {
    return (!this.stillHasLivingMembers(this.enemyIdols));
  };

  enemyHasWon() {
    return (!this.stillHasLivingMembers(this.playerIdols));
  };

  nextMove() {
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

  render() {
    battleElement.innerHTML = battleTemplate(this, {allowedProtoMethods: {healthBar: true}});

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
}

function bindHoverDetail(idol: BattleIdol, idolElement: Element) {
  var showing = false;
  var deetsSpace = document.getElementById('deets-space')!;

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

function playAnimationCanvas(ability: Ability, element: Element) {
  var portraitDiv = element.querySelector('.portrait')!;
  var currentImage = 0;
  var animationCanvas = document.createElement('Canvas') as HTMLCanvasElement;

  portraitDiv.setAttribute("data-ability-name", ability.name);
  animationCanvas.style.position = "absolute";
  animationCanvas.style.display = "inline";
  animationCanvas.style.left = "2"
  animationCanvas.style.zIndex = "3"

  var ctx = animationCanvas.getContext('2d')!;
  portraitDiv.appendChild(animationCanvas);

  ctx.canvas.width = 256;
  ctx.canvas.height = 256;

  var animationID = setInterval(function () {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(anims.get(ability.animation)!, 0, (-256 * currentImage));
    currentImage++;
  }, (animationDuration / 14));

  setTimeout(function () {
    clearInterval(animationID);

    portraitDiv.removeChild(animationCanvas);
    portraitDiv.removeAttribute("data-ability-name");
  }, animationDuration);
}
