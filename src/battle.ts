import * as Handlebars from 'handlebars'
import {
  ANIMATIONS,
} from './parts'
import { askUser } from './util'
import { Ability, Idol, celebrate } from './game'

export enum Affinity { rock, paper, scissors }
export type AffinityType = keyof typeof Affinity
export const AFFINITIES: AffinityType[] = ['rock', 'paper', 'scissors']

const battleElement = document.getElementById('battle')!

const abilityPromptTemplate = Handlebars.compile(document.getElementById('ability-prompt-template')!.innerHTML)
const battleTemplate = Handlebars.compile(document.getElementById('battle-template')!.innerHTML)
const healthBarTemplate = Handlebars.compile(document.getElementById('health-bar-template')!.innerHTML)
const idolDeetsTemplate = Handlebars.compile(document.getElementById('idol-deets-template')!.innerHTML)

const SAME_TYPE_ATTACK_BONUS = 1.5
const SUPER_EFFECTIVE_ATTACK_BONUS = 2
const BASIC_ABILITY_DAMAGE = 15

const animationDuration = 1000
const anims: Record<string, HTMLImageElement> = {}

let hoverDetailTimeout: ReturnType<typeof setTimeout>

function loadAnimations() {
  for(let i = 0; i < ANIMATIONS.length; i++) {
    const name = ANIMATIONS[i]
    const img = new Image()
    img.src = name
    anims[name] = img
  }
}

loadAnimations()

function effectiveness(attackAffinity: AffinityType, targetAffinity: AffinityType): number {
  const attackIndex = AFFINITIES.indexOf(attackAffinity)
  const targetIndex = AFFINITIES.indexOf(targetAffinity)
  const effectivenessIdentifier = ((attackIndex + AFFINITIES.length) - targetIndex) % 3
  return {
    0: 1,  // the attack is the same type as the defense
    1: SUPER_EFFECTIVE_ATTACK_BONUS, // the attack is strong
    2: 1/SUPER_EFFECTIVE_ATTACK_BONUS // the attack is weak
  }[effectivenessIdentifier]!
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
  element?: HTMLElement

  constructor(idol: Idol, control: 'ai' | 'player') {
    this.idol = idol

    if (control === 'ai') {
      this.playerControlled = false
    } else if (control == 'player') {
      this.playerControlled = true
    } else {
      throw 'you need to specify a control mode for a BattleIdol'
    }

    this.thumbSpriteHTML = idol.thumbSpriteHTML()
    const statModifier = 1.01
    function modStat(stat: number, mod: number) {
      return Math.ceil(mod * Math.pow(statModifier, stat))
    }

    this.attack = modStat(idol.effective.attack(), 100)
    this.defense = modStat(idol.effective.defense(), 100)
    this.speed = modStat(idol.effective.speed(), 20)

    this.maxHp = 50
    this.hp = this.maxHp

    this.abilities = idol.abilities
    this.affinity = idol.affinity
  }

  doDamage(damage: number) {
    const self = this
    if (this.isDead) return
    this.hp = this.hp - damage

    if (this.hp <= 0) {
      this.isDead = true
      this.hp = 0

      setTimeout(function() {
        self.element!.classList.add('dead')
        if (!self.playerControlled) self.idol.agency.grantExperience(1)
      }, animationDuration)
    }
    (this.element!.querySelector('.health-bar-content') as HTMLElement).style.width = this.healthPercent().toString(10) + '%';
    (this.element!.querySelector('.health-bar-trail') as HTMLElement).style.width = this.healthPercent().toString(10) + '%'
  }

  doMove(moveIndex: number, target: BattleIdol) {
    const self = this
    self.element!.classList.add('fighting')

    const ability = self.abilities[moveIndex]

    const baseStrength = (this.attack / target.defense) * BASIC_ABILITY_DAMAGE
    let abilityStrength = baseStrength + ((baseStrength/5) * ability.strength)

    if (ability.affinity === self.affinity) {
      abilityStrength = abilityStrength * SAME_TYPE_ATTACK_BONUS
    }

    abilityStrength = abilityStrength * effectiveness(ability.affinity, target.affinity)
    abilityStrength = Math.ceil(abilityStrength)

    target.doDamage(abilityStrength)
    console.log(this.idol.name + ' did ' + abilityStrength.toString(10) + ' damage to ' + target.idol.name + ', bringing her HP to ' + target.hp.toString(10) + '/' + target.maxHp.toString(10))

    playAnimationCanvas(self.abilities[moveIndex], target.element!)

    setTimeout(function() {
      self.element!.classList.remove('fighting')
      self.battle!.nextMove()
    }, animationDuration)
  }

  healthPercent(): number {
    return (this.hp / this.maxHp) * 100
  }

  healthBar(): string {
    return healthBarTemplate(this, {allowedProtoMethods: {healthPercent: true}})
  }
}

export class Battle {
  playerIdols: BattleIdol[]
  enemyIdols: BattleIdol[]
  victoryCallback: (arg0: Battle) => void
  lossCallback: (arg0: Battle) => void
  fleeCallback: (arg0: Battle) => void
  turnOrder: BattleIdol[]
  turnIndex?: number

  constructor(
    playerIdols: BattleIdol[],
    enemyIdols: BattleIdol[],
    victoryCallback: (arg0: Battle) => void,
    lossCallback: (arg0: Battle) => void,
    fleeCallback: (arg0: Battle) => void
  ) {
    this.playerIdols = playerIdols
    this.enemyIdols = enemyIdols

    this.victoryCallback = victoryCallback
    this.lossCallback = lossCallback
    this.fleeCallback = fleeCallback

    this.render()

    document.body.classList.add('in-battle')

    this.turnOrder = []
  }

  loop() {
    this.turnOrder = []

    Array.prototype.push.apply(this.turnOrder, this.playerIdols)
    Array.prototype.push.apply(this.turnOrder, this.enemyIdols)

    this.turnOrder.sort(function(a, b) {
      return b.speed - a.speed
    })

    for (let i = 0; i < this.turnOrder.length; i++) {
      this.turnOrder[i].battle = this
    }

    this.nextMove()
  }

  hide() {
    document.body.classList.remove('in-battle')
  }

  flee() {
    this.hide()

    if (this.fleeCallback) {
      this.fleeCallback(this)
    } else {
      askUser('You ran away.')
    }
  }

  determinePlayerMove(idol: BattleIdol) {
    const self = this
    const abilityPromptElement = document.getElementById('ability-prompt')!

    function pickMove(e: Event) {
      e.stopPropagation()
      e.preventDefault()

      const targetInput = document.querySelector('input[name="target"]:checked') as HTMLInputElement
      const moveInput = document.querySelector('input[name="move"]:checked')
      if ((!targetInput) || (!moveInput)) {
        askUser('You have to pick both a target and a move')
        return
      }

      document.getElementById('battle-form')!.removeEventListener('submit', pickMove)

      const targetIndex = parseInt(targetInput.getAttribute('value')!, 10)
      const abilityIndex = parseInt(moveInput.getAttribute('value')!, 10)

      abilityPromptElement.innerHTML = ''
      idol.element!.classList.remove('focussed')
      targetInput.checked = false
      abilityPromptElement.innerHTML = ''
      idol.doMove(abilityIndex, self.enemyIdols[targetIndex])
    }

    idol.element!.classList.add('focussed')
    abilityPromptElement.innerHTML = abilityPromptTemplate(idol)

    document.getElementById('battle-form')!.addEventListener('submit', pickMove)
    document.getElementById('flee')!.addEventListener('click', function(e) {
      e.stopPropagation()
      e.preventDefault()
      self.flee()
    })

    return
  }

  tookDamage(team: BattleIdol[]) {
    for (let i = 0; i < team.length; i++) {
      if (team[i].hp !== team[i].maxHp) return true
    }
    return false
  }

  stillHasLivingMembers(team: BattleIdol[]) {
    return this.numberOfLivingMembers(team) > 0
  }

  numberOfLivingMembers(team: BattleIdol[]) {
    let livingMemberCount = 0

    for (let i = 0; i < team.length; i++) {
      if (!team[i].isDead) livingMemberCount++
    }

    return livingMemberCount
  }

  playerHasWon() {
    return (!this.stillHasLivingMembers(this.enemyIdols))
  }

  enemyHasWon() {
    return (!this.stillHasLivingMembers(this.playerIdols))
  }

  nextMove() {
    const self = this

    if ((this.turnIndex === undefined) || (this.turnOrder[this.turnIndex] === undefined)) {
      this.turnIndex = 0
    }

    const idol = this.turnOrder[this.turnIndex]

    if (this.playerHasWon() || this.enemyHasWon()) {
      setTimeout(function() {
        self.hide()

        if (self.playerHasWon()) {
          celebrate(self.numberOfLivingMembers(self.playerIdols))
          self.victoryCallback(self)
        } else if (self.enemyHasWon()) {
          self.lossCallback(self)
        }

      }, animationDuration)
      return
    }

    this.turnIndex += 1

    if (idol.isDead) {
      this.nextMove()
    } else if (!idol.playerControlled) {
      const livingPlayerIdols = []
      for (let i = 0; i < this.playerIdols.length; i++) {
        if (!this.playerIdols[i].isDead) livingPlayerIdols.push(this.playerIdols[i])
      }

      idol.doMove(
        Math.floor(Math.random() * idol.abilities.length),
        livingPlayerIdols[Math.floor(Math.random() * livingPlayerIdols.length)]
      )
    } else {
      this.determinePlayerMove(idol)
    }
  }

  render() {
    battleElement.innerHTML = battleTemplate(this, {allowedProtoMethods: {healthBar: true}})

    const playerIdolElements = battleElement.querySelectorAll('#player-idols > li')
    for (let pi = 0; pi < this.playerIdols.length; pi++) {
      this.playerIdols[pi].element = playerIdolElements[pi] as HTMLElement
      bindHoverDetail(this.playerIdols[pi], playerIdolElements[pi])
    }

    const enemyIdolElements = battleElement.querySelectorAll('#enemy-idols > li')
    for (let ei = 0; ei < this.enemyIdols.length; ei++) {
      this.enemyIdols[ei].element = enemyIdolElements[ei] as HTMLElement
      bindHoverDetail(this.enemyIdols[ei], enemyIdolElements[ei])
    }
  }
}

function bindHoverDetail(idol: BattleIdol, idolElement: Element) {
  const showing = false
  const deetsSpace = document.getElementById('deets-space')!

  function showHoverDetail() {
    if (showing) return

    if (idol.playerControlled) {
      deetsSpace.classList.add('player')
      deetsSpace.classList.remove('enemy')
    } else {
      deetsSpace.classList.remove('player')
      deetsSpace.classList.add('enemy')
    }

    deetsSpace.setAttribute('data-affinity', idol.idol.affinity)
    deetsSpace.innerHTML = idolDeetsTemplate(idol)
    deetsSpace.classList.add('visible')
  }

  function showHoverDetailSoon() {
    clearTimeout(hoverDetailTimeout)
    hoverDetailTimeout = setTimeout(showHoverDetail, 300)
  }

  function hideHoverDetail() {
    clearTimeout(hoverDetailTimeout)
    deetsSpace.classList.remove('visible')
  }

  const startEvents = ['touchenter', 'touchstart', 'mouseenter']
  for (let si = 0; si < startEvents.length; si++) idolElement.addEventListener(startEvents[si], showHoverDetailSoon)

  const endEvents = ['touchleave', 'touchend', 'touchcancel', 'mouseleave', 'click']
  for (let ei = 0; ei < endEvents.length; ei++) idolElement.addEventListener(endEvents[ei], hideHoverDetail)

  idolElement.addEventListener('contextmenu', function(e) { e.preventDefault(); e.stopPropagation() })
}

function playAnimationCanvas(ability: Ability, element: Element) {
  const portraitDiv = element.querySelector('.portrait')!
  let currentImage = 0
  const animationCanvas = document.createElement('Canvas') as HTMLCanvasElement

  portraitDiv.setAttribute("data-ability-name", ability.name)
  animationCanvas.style.position = "absolute"
  animationCanvas.style.display = "inline"
  animationCanvas.style.left = "2"
  animationCanvas.style.zIndex = "3"

  const ctx = animationCanvas.getContext('2d')!
  portraitDiv.appendChild(animationCanvas)

  ctx.canvas.width = 256
  ctx.canvas.height = 256

  const animationID = setInterval(function () {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.drawImage(anims[ability.animation], 0, (-256 * currentImage))
    currentImage++
  }, (animationDuration / 14))

  setTimeout(function () {
    clearInterval(animationID)

    portraitDiv.removeChild(animationCanvas)
    portraitDiv.removeAttribute("data-ability-name")
  }, animationDuration)
}
