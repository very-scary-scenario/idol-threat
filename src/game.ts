import * as Handlebars from 'handlebars'
import {
  ABILITIES,
  ANIMATIONS,
  BARCODES,
  BIOS,
  BOSS_NAMES,
  CHAPTERS,
  FINAL_LOOP_ORDER,
  GRADUATION_BONUSES,
  HAIR_COLOURS,
  INITIAL_CHAPTER_ORDER,
  KANA,
  PARTS,
  POSES,
  QUOTES,
  SKIN_COLOURS,
  UNIT_NAMES,
} from './parts'
import { Affinity, AffinityType, AFFINITIES, Battle, BattleIdol } from './battle'
import { askUser, AbilityPart, Part } from './util'
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import { DecodeHintType, Result } from '@zxing/library'
import { FastClick } from 'fastclick'
const wordfilter = require('wordfilter')

type BarcodeOverrideType = keyof typeof BARCODES

const VOWELS = 'aeiou'
const N = 'n'
enum Stat { attack, speed, defense }
type StatType = keyof typeof Stat;
const STATS: StatType[] = ['attack', 'speed', 'defense']
type SpriteMode = 'med' | 'thumb' | 'huge'

interface StatDump { attack: number, speed: number, defense: number }
interface IdolDump {
  a: number  // recruited at
  b: []  // XXX i am not sure what this is
  f: boolean  // favourite
  i: number  // seed
  r: boolean  // shiny
  s: StatDump
}
interface AgencyDump {
  i: IdolDump[],  // recruits
  u: number[],  // 0 or 1, whether the idol at this index is in the current unit
  x: number,  // experience
  p: UpgradesRecord,
  b: number,  // story chapters beaten
  q: number,  // quick battle ranking
  f: number[],  // recently fired
  o: IdolSortOrder,
}

type LayerType = keyof typeof PARTS
const LAYERS: LayerType[] = [
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
]

const RARITIES = [
  'Charred',
  'Well done',
  'Medium well',
  'Medium',
  'Medium rare',
  'Rare',
  'Blue',
  'Raw',
  'Mooing'
]
const BASE_RARITY = 300
const RARITY_CURVE = 0.6

const CHAPTER_DIFFICULTY_INCREASE = 50

const SHINY_CHANCE = 1/4096

const MAXIMUM_CATALOG_SIZE = 50
const CATALOG_FULL = "Your agency is full! You'll have to graduate or train with some of them before you can recruit any more."

type SeedOverrideType = keyof typeof BARCODES
const SEED_OVERRIDE_HANDLERS: Record<SeedOverrideType, (idol: Idol) => void> = {
  shadow: function(idol: Idol) {
    idol.firstName = 'Jack'
    idol.lastName = 'Ryan'
    idol.cacheName()

    for (const stat of STATS) {
      idol.stats[stat] = 100
    }

    idol.bio = "Somebody tried to kill her. She lied to her wife for three years. Didn't give them her PhD."
    idol.quote = "Now, talk me through your very scary scenario."

    function makeSpecialAbility(name: string, affinity: AffinityType) {
      return new Ability(idol, [{words: [name], bonus: 3, healing: false}], choice(ANIMATIONS, idol.rand()), affinity)
    }
    idol.abilities = [
      makeSpecialAbility('play rough', 'rock'),
      makeSpecialAbility('geopolitics', 'paper'),
      makeSpecialAbility('american directness', 'scissors'),
      makeSpecialAbility('very scary scenario', idol.affinity)
    ]
  }
}
const SEED_OVERRIDES: Record<number, (idol: Idol) => void> = {}

let CAMERA_DENIED = false
const hints = new Map()
hints.set(DecodeHintType.TRY_HARDER, true)
const codeReader = new BrowserQRCodeReader()
codeReader.hints = hints

function parsePresetBarcodes() {
  // cache what overrides we need to apply for a given seed
  let overrideList

  for (const override in BARCODES) {
    overrideList = BARCODES[override as BarcodeOverrideType]

    for (let i = 0; i < overrideList.length; i++) {
      SEED_OVERRIDES[numFromString(overrideList[i])] = SEED_OVERRIDE_HANDLERS[override as BarcodeOverrideType]
    }
  }
}

function getBoss(name: string) {
  if (BOSS_NAMES.indexOf(name) === -1) throw name + ' is not a real boss'
  const boss = new Idol(numFromString(name))
  boss.actorName = name
  const path = 'bosses/' + name + '.png'
  boss.parts = [{path: path, medPath: path, thumbPath: path}]
  return boss
}

const LETTER_DELAY = 20
const LETTER_EMPHASIS_MULTIPLIER = 4
const LETTER_DELAYS: Record<string, number> = {
  '.': 8,
  ',': 4
}

const NEGATIVE_STAT_EFFECT = 2

const RECENT_FIRING_MEMORY = 20

const confetti = require('./vendor/confetti/confetti.js').confetti
let confettiTimeout: ReturnType<typeof setTimeout> | undefined
let letterTimeout: ReturnType<typeof setTimeout> | undefined

const cookieExpiryDate = new Date()
cookieExpiryDate.setFullYear(cookieExpiryDate.getFullYear() + 50)
const cookieSuffix = '; SameSite=Strict; expires=' + cookieExpiryDate.toUTCString()
const cookieSliceSize = 2000
const endString = 'end'

let isSkipping = false
let unbindScriptClick: () => void

var idolSorters = {
  date: function(a: Idol, b: Idol) { return b.recruitedAt - a.recruitedAt },
  statSpeed: function(a: Idol, b: Idol) { return b.stats.speed - a.stats.speed },
  statAttack: function(a: Idol, b: Idol) { return b.stats.attack - a.stats.attack },
  statDefense: function(a: Idol, b: Idol) { return b.stats.defense - a.stats.defense },
  unitMembership: function(a: Idol, b: Idol) { return (Number(b.isInUnit()) - Number(a.isInUnit())) },
  allStats: function(a: Idol, b: Idol) { return b.totalStats() - a.totalStats() },
  affinity: function(a: Idol, b: Idol) { return (
    (AFFINITIES.indexOf(a.affinity) - AFFINITIES.indexOf(b.affinity)) +
    (idolSorters.allStats(a, b) / 10000)
  ) }
}

const idolSortNames = {
  date: 'Date recruited',
  statSpeed: 'Speed',
  statAttack: 'Attack',
  statDefense: 'Defense',
  allStats: 'Total of all stats',
  affinity: 'Affinity and stats',
  unitMembership: 'Unit membership'
}
type IdolSortOrder = keyof typeof idolSortNames
type SortOrder = {
  key: IdolSortOrder
  name: string
  selected: boolean
}

const upgradeNames = {
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
}
interface UpgradesRecord {
  attack: number
  speed: number
  defense: number
  recruitment: number
  graduation: number
}

type UpgradeType = keyof typeof upgradeNames

function getStateCookie() {
  const cookieStrings = document.cookie.split(';')

  const indices: number[] = []
  const fragments = new Map<number, string>()

  for(let i = 0, n = cookieStrings.length; i < n; i++) {
    const matches = cookieStrings[i].match(/(?:state_(\d+)+=)(.*)/)
    if (!matches) {
      continue
    }
    const index = parseInt(matches[1], 10)
    const fragment = matches[2]
    indices.push(index)
    fragments.set(index, fragment)
  }
  
  indices.sort(function(a, b) { return a - b })

  let stateString = ''

  for (let f = 0; f < indices.length; f++) {
    const thisFragment = fragments.get(indices[f])
    if (thisFragment === endString) break
    stateString += thisFragment
  }

  return atob(stateString)
}

const barcodeImage = document.getElementById('barcode-image') as HTMLInputElement
const scannerOverlay = document.getElementById('scanner-overlay')!
const cancelScanningElement = document.getElementById('cancel-scanning')!
const loadGame = document.getElementById('load-game') as HTMLInputElement
const detailElement = document.getElementById('idol-detail')!
const catalogElement = document.getElementById('catalog')!
const unitElement = document.getElementById('unit')!
const unitDetailElement = document.getElementById('unit-detail')!
const auditionSpace = document.getElementById('audition-space')!
const canteenElement = document.getElementById('canteen')!
const theatreElement = document.getElementById('theatre')!
const xpIndicatorsElement = document.getElementById('xp-indicators')!

const spriteTemplate = Handlebars.compile(document.getElementById('sprite-template')!.innerHTML)
const catalogTemplate = Handlebars.compile(document.getElementById('catalog-template')!.innerHTML)
const unitTemplate = Handlebars.compile(document.getElementById('unit-template')!.innerHTML)
const unitDetailTemplate = Handlebars.compile(document.getElementById('unit-detail-template')!.innerHTML)
const idolDetailTemplate = Handlebars.compile(document.getElementById('idol-detail-template')!.innerHTML)
const auditionTemplate = Handlebars.compile(document.getElementById('audition-template')!.innerHTML)
const canteenTemplate = Handlebars.compile(document.getElementById('canteen-template')!.innerHTML)
const canteenConfirmTemplate = Handlebars.compile(document.getElementById('canteen-confirm-template')!.innerHTML)
const theatreTemplate = Handlebars.compile(document.getElementById('theatre-template')!.innerHTML)

const maxUnitSize = 3
let rerenderTimeout: ReturnType<typeof setTimeout> | undefined
let checkSaveTimeout: ReturnType<typeof setTimeout> | undefined

let currentlyShowingDetail: Idol | undefined

function choice<T>(list: T[], slice: number): T {
  const result = list[Math.floor(slice * list.length)]
  return result
}

function seededRandom(seed: number): (max?: number, min?: number) => number {
  function rand(max?: number, min?: number) {
    max = max || 1
    min = min || 0

    seed = (seed * 9301 + 49297) % 233280
    const rnd = seed / 233280

    return min + rnd * (max - min)
  }

  rand()

  return rand
}

export function celebrate(density = 1) {
  confetti.setDensity(density)
  if (!confettiTimeout) {
    confetti.restart()
    clearTimeout(confettiTimeout)
  }
  confettiTimeout = setTimeout(function() {
    confetti.stop()
    if (confettiTimeout) clearTimeout(confettiTimeout)
    confettiTimeout = undefined
  }, 3000)
}

const sparkleImage = new Image()
sparkleImage.src = 'img/vendor/sparkle.png'

const SparkleEmitter = require('./vendor/sparkle/sparkle.js').SparkleEmitter

function initSparkle(sparkleCanvas: HTMLCanvasElement) {
  const sparkleContext = sparkleCanvas.getContext('2d')!
  const sparkleEmitter = new SparkleEmitter(sparkleCanvas)

  sparkleCanvas.width = sparkleCanvas.clientWidth * (window.devicePixelRatio || 1)
  sparkleCanvas.height = sparkleCanvas.clientHeight * (window.devicePixelRatio || 1)

  sparkleEmitter.setParticlesPerSecond(40)
  sparkleEmitter.setParticleLifetime(15)
  sparkleEmitter.setPosition({x: sparkleCanvas.width/2, y: -(sparkleCanvas.height/5)})
  sparkleEmitter.setGravity(sparkleCanvas.clientHeight/3)
  sparkleEmitter.setParticleSpeed(sparkleCanvas.clientHeight/3)
  sparkleEmitter.setDirection(90)
  sparkleEmitter.setRadius(360)

  const size = sparkleCanvas.height/8

  sparkleEmitter.drawParticle = function(x: number, y: number, particle: any) {
    // this.context.setTransform(0, 0, 0, 0, particle.x, particle.y);
    // this.context.rotate(sparkleEmitter.getParticleAge(particle) / 100);
    this.context.globalAlpha = Math.max(particle.opacity * Math.sin(
      (sparkleEmitter.getParticleAge(particle) + (particle.born * 10)) / 100), 0
    )
    this.context.globalCompositeOperation = 'source-over'
    this.context.drawImage(sparkleImage, x-(size/2), y-(size/2), size, size)
    return this
  }

  function drawSparkle() {
    sparkleContext.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height)
    sparkleEmitter.fire()
    requestAnimationFrame(drawSparkle)
  }
  
  drawSparkle()
}

function getRarity(stats: number): string {
  if (stats < 0) return RARITIES[0]
  const rarityIndex = Math.floor(Math.pow(stats/BASE_RARITY, RARITY_CURVE))
  return RARITIES[rarityIndex] || RARITIES[RARITIES.length - 1]
}

export class Ability {
  strength: number
  healing: boolean
  affinity: AffinityType
  name: string
  animation: string

  constructor(idol: Idol, parts: AbilityPart[], animation: string, affinity: AffinityType) {
    this.strength = 0
    this.healing = false
    this.affinity = affinity

    const partNames = []

    for(let i = 0, n = parts.length; i < n; i++) {
      const part = parts[i]
      partNames.push(choice(part.words, idol.rand()))
      this.strength += part.bonus
      if (part.healing) {
        this.healing = true
      }
    }

    this.name = partNames.join(' ')

    this.animation = animation
  }
}

function effectiveStatGetter(idol: Idol, stat: StatType): () => number {
  return function(): number {
    if (agency.catalog.indexOf(idol) !== -1) {
      // only grant agency bonus if this idol is in our agency
      return idol.stats[stat] + agency.upgradeFor[stat]()
    } else {
      return idol.stats[stat]
    }
  }
}

export class Idol {
  seed: number
  recruitedAt: number
  favourite: boolean
  identifier: string
  rand: (min?: number, max?: number) => number
  firstName: string
  lastName: string
  name: string
  bio: string
  quote: string
  abilities: Ability[]
  stats: Record<string, number> = {}
  effective: Record<string, () => number> = {}
  affinity: AffinityType
  actorName?: string
  parts: Part[] = []
  shiny = false
  agency: Agency = agency
  catalogElement?: Element
  loadedImages: Record<SpriteMode, HTMLImageElement[] | null> = {
    thumb: null,
    med: null,
    huge: null,
  }
  loadedThumbSprite?: string
  seedOverride?: string

  constructor(seed: number) {
    this.seed = seed
    this.recruitedAt = new Date().getTime()
    this.favourite = false
    this.identifier = seed.toString(10)
    const rand = seededRandom(seed)
    this.rand = rand

    // build stats
    for(const stat of STATS) {
      this.stats[stat] = Math.floor(rand(-100, 100))
      this.effective[stat] = effectiveStatGetter(this, stat)
    }

    this.abilities = []

    // build name
    this.firstName = this.generateName()
    this.lastName = this.generateName()
    this.name = this.cacheName()

    // build portrait
    let partsMissing = true
    let pose: string, skinColour: string, hairColour: string

    function partIsAllowed(part: Part) {
      if (part.pose && part.pose !== pose) return false
      if (part.skinColour && part.skinColour !== skinColour) return false
      if (part.hairColour && part.hairColour !== hairColour) return false
      return true
    }

    this.parts = []

    while (partsMissing) {
      partsMissing = false
      pose = choice(POSES, rand())
      skinColour = choice(SKIN_COLOURS, rand())
      hairColour = choice(HAIR_COLOURS, rand())

      this.parts = []

      for(let li = 0, ln = LAYERS.length; li < ln; li++) {
        const options = (PARTS[LAYERS[li]] as Part[]).filter(partIsAllowed)
        if (options.length === 0) {
          partsMissing = true
        } else {
          this.parts.push(choice(options, rand()))
        }
      }
    }

    // build bio
    const bioParts = []
    while(bioParts.length < 3) {
      const part = choice(BIOS, rand())
      if (bioParts.indexOf(part) === -1) {
        bioParts.push(part)
      }
    }
    this.bio = bioParts.join(' ')
    this.quote = choice(QUOTES, rand())

    // build moveset
    while (this.abilities.length < 4) {
      const abilityParts = []

      abilityParts.push(choice(ABILITIES[0], rand()))
      if (rand() > 0.8) abilityParts.push(choice(ABILITIES[1], rand()))
      abilityParts.push(choice(ABILITIES[2], rand()))

      this.abilities.push(new Ability(this, abilityParts, choice(ANIMATIONS, rand()), choice(AFFINITIES, rand())))
    }

    // build affinity
    this.affinity = choice(AFFINITIES, rand())

    this.handleOverrides()
  }

  generateName(): string {
    let name = ''
    let kanaCount = Math.floor(this.rand(4, 2))
    while (kanaCount > 0) {
      const targetDepth = this.rand()
      let currentDepth = 0
      var nextKana

      for (let ki = 0; ki < KANA.length; ki++) {
        const item = KANA[ki]
        nextKana = item.kana
        currentDepth += item.weight
        if (currentDepth >= targetDepth) {
          break
        }
      }

      name += nextKana
      if (this.rand() > 0.9) name += N

      kanaCount--
    }
    name = name[0].toUpperCase() + name.slice(1)
    if (wordfilter.blacklisted(name)) return this.generateName()
    return name
  }

  cacheName(): string {
    this.name = [this.firstName, this.lastName].join(' ')
    return this.name
  }

  applyRecruitmentBonuses() {
    const multiplier = 1 + (agency.upgrades.recruitment / 10)

    for (const stat of STATS) {
      this.stats[stat] = Math.floor(this.stats[stat] * multiplier)
    }

    this.shiny = Math.random() <= SHINY_CHANCE
  }

  applyQuickBattleRankingBonuses() {
    for (const stat of STATS) {
      const currentStat = this.stats[stat]
      this.stats[stat] = currentStat + (10 * agency.quickBattleRanking)
    }
  }

  deferRendering(mode: SpriteMode, callback: undefined | (() => void)) {
    const self = this
    mode = mode || 'med'

    if (this.loadedImages[mode] !== null) return  // we're already loading

    let loaded = 0
    const images: HTMLImageElement[] = []
    this.loadedImages[mode] = images

    function renderIfLoaded() {
      loaded++
      if (loaded === self.parts.length) {
        if (callback !== undefined) callback()
        self.renderSprite(mode)
      }
    }

    for (let pi = 0; pi < this.parts.length; pi++) {
      const chosenPart = this.parts[pi]
      const img = new Image()

      images.push(img)
      var attr: 'thumbPath' | 'medPath' | 'path'
      if (mode === 'thumb') attr = 'thumbPath'
      else if (mode === 'med') attr = 'medPath'
      else if (mode === 'huge') attr = 'path'
      else { throw `no such mode ${mode}`}
      img.src = chosenPart[attr]
      img.addEventListener('load', renderIfLoaded)
    }
  }

  getSprite(mode?: SpriteMode) {
    this.deferRendering(mode || 'med', () => {})
    return 'img/placeholder.png'
  }

  getThumbSprite() { return this.getSprite('thumb') }
  getHugeSprite() { return this.getSprite('huge') }
  canFeed() { return this.agency.canFeed() }
  renderSprite(mode?: SpriteMode) {
    if (mode === undefined) mode = 'med'

    const images = this.loadedImages[mode]
    if (!images) {
      throw 'no images to render'
    }

    const offscreenCanvasElement = document.createElement('canvas')!
    const offscreenCanvas = offscreenCanvasElement.getContext('2d')!

    offscreenCanvas.canvas.width = images[0].naturalWidth
    offscreenCanvas.canvas.height = images[0].naturalHeight

    offscreenCanvas.clearRect(0, 0, offscreenCanvas.canvas.width, offscreenCanvas.canvas.height)

    for (let i = 0; i < images.length; i++) {
      offscreenCanvas.drawImage(images[i], 0, 0)
    }

    // masking, for a fade at the bottom
    offscreenCanvas.globalCompositeOperation = 'destination-in'
    const gradient = offscreenCanvas.createLinearGradient(0, 0, 0, offscreenCanvas.canvas.height)
    gradient.addColorStop(0.9, 'rgba(0, 0, 0, 1)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    offscreenCanvas.fillStyle = gradient
    offscreenCanvas.fillRect(0, 0, offscreenCanvas.canvas.width, offscreenCanvas.canvas.height)

    const subbableImages = document.querySelectorAll('.sprite img[data-sprite-' + mode + '-id="' + this.identifier + '"]') as NodeListOf<HTMLImageElement>
    const dataURL = offscreenCanvasElement.toDataURL()

    for (let si = 0; si < subbableImages.length; si++) {
      subbableImages[si].src = dataURL
    }

    if (mode === 'thumb') {
      this.loadedThumbSprite = dataURL
    }

    this.loadedImages[mode] = null  // free up some memory?
  }

  spriteHTML(mode?: SpriteMode) {
    if (mode === undefined) mode = 'med'
    let sprite

    if (mode === 'med') {
      sprite = this.getSprite()
    } else if (mode === 'thumb') {
      sprite = this.loadedThumbSprite || this.getThumbSprite()
    } else if (mode === 'huge') {
      sprite = this.getHugeSprite()
    } else {
      throw 'what is ' + mode
    }

    return spriteTemplate({
      mode: mode,
      identifier: this.identifier,
      shiny: this.shiny,
      sprite: sprite
    })
  }

  thumbSpriteHTML() { return this.spriteHTML('thumb') }
  hugeSpriteHTML() { return this.spriteHTML('huge') }
  isInUnit() { return agency.unit.indexOf(this) !== -1 }

  totalStats() {
    let total = 0

    for (const stat of STATS) {
      total += this.stats[stat]
    }

    return total
  }

  rarity() {
    return getRarity(this.totalStats())
  }
  toggleUnitMembership() {
    if (this.isInUnit()) {
      agency.unit.splice(agency.unit.indexOf(this), 1)
      if (this.catalogElement !== undefined) {
        this.catalogElement.classList.remove('active')
      }
    } else {
      agency.addToUnit(this, true)
    }

    agency.renderUnit()
    saveGame()
  }
  giveBonus(count: number) {
    if (count === undefined) count = 1

    while (count > 0) {
      count--
      const statKey = choice(STATS, Math.random())
      this.stats[statKey] = (this.stats[statKey] || 0) + 1
    }

    deferRerender()
  }
  showDetail() {
    const self = this
    currentlyShowingDetail = this

    document.body.classList.add('overlay')
    detailElement.innerHTML = idolDetailTemplate(this, {allowedProtoMethods: {
      hugeSpriteHTML: true,
      isInUnit: true,
      rarity: true,
      canFeed: true
    }})
    detailElement.setAttribute('data-affinity', this.affinity)
    detailElement.classList.add('shown')
    detailElement.querySelector('.close')!.addEventListener('click', hideIdolDetail)

    function showFeedingUI(event: Event) {
      event.stopPropagation()
      event.preventDefault()

      const catalogWithoutSelf = self.agency.sortedCatalog()
      catalogWithoutSelf.splice(catalogWithoutSelf.indexOf(self), 1)

      canteenElement.innerHTML = canteenTemplate({
        idol: self,
        catalog: catalogWithoutSelf
      }, {
        allowedProtoMethods: {
          isInUnit: true,
          thumbSpriteHTML: true,
        },
      })

      canteenElement.querySelector('.cancel')!.addEventListener('click', function(event) {
        event.stopPropagation()
        event.preventDefault()
        canteenElement.innerHTML = ''
      })

      function requestFeeding(event: Event) {
        event.stopPropagation()
        event.preventDefault()

        const foodIdol = catalogWithoutSelf[parseInt((event.currentTarget as HTMLElement).getAttribute('data-index')!, 10)] as Idol
        const negativeStats: Record<StatType, boolean | null> = {attack: null, speed: null, defense: null}
        const summedStats: Record<StatType, number | null> = {attack: null, speed: null, defense: null}
        const diffedStats: Record<StatType, number | null> = {attack: null, speed: null, defense: null}
        let totalChange = 0

        for (const stat of STATS) {
          let increaseBy = foodIdol.stats[stat]
          if (increaseBy < 0) {
            increaseBy /= NEGATIVE_STAT_EFFECT
            negativeStats[stat] = true
          }
          const delta = Math.ceil(increaseBy)
          diffedStats[stat] = delta
          totalChange += delta
          summedStats[stat] = self.stats[stat] + delta
        }

        canteenElement.innerHTML = canteenConfirmTemplate({
          idol: self,
          food: foodIdol,
          diffedStats: diffedStats,
          summedStats: summedStats,
          negativeStats: negativeStats,
          totalChange: totalChange,
          changeIsBeneficial: totalChange >= 0
        })

        canteenElement.querySelector('.no')!.addEventListener('click', showFeedingUI)
        canteenElement.querySelector('.yes')!.addEventListener('click', function(event) {
          event.stopPropagation()
          event.preventDefault()
          for (const stat of STATS) {
            self.stats[stat] = summedStats[stat]!
          }
          agency.removeIdol(foodIdol)
          canteenElement.innerHTML = ''
          self.showDetail()
          askUser('Training complete!')
          agency.grantExperience(5)
          celebrate()
        })
      }

      const idolElements = canteenElement.querySelectorAll('.idol.enabled')

      for (let i = 0; i < idolElements.length; i++) {
        idolElements[i].addEventListener('click', requestFeeding)
      }
    }

    const feedElement = detailElement.querySelector('.feed')
    if (feedElement) feedElement.addEventListener('click', showFeedingUI)

    detailElement.querySelector('.graduate')!.addEventListener('click', function(event) {
      event.stopPropagation()
      event.preventDefault()

      if (self.favourite) {
        askUser('You cannot graduate ' + self.name + ' while you have her marked as a favourite idol.')
        return
      }

      function graduate() {
        hideIdolDetail(event)
        agency.removeIdol(self)
        const graduationBonus = choice(GRADUATION_BONUSES, Math.random())
        const bonus = graduationBonus.bonus + agency.upgrades.graduation
        const template = graduationBonus.template

        for (let i = 0; i < agency.catalog.length; i++) {
          agency.catalog[i].giveBonus(bonus)
        }

        askUser(
          template.replace('<idol>', self.name) +
          ' The other idols in your agency get ' + bonus.toString(10) + ' bonus stat point' + ((bonus === 1) ? '' : 's') + ' each.'
        )

        agency.grantExperience(5)
        celebrate(graduationBonus.bonus)
        rerender()
      }

      askUser('Do you want ' + self.name + ' to graduate? She will leave your agency and every other idol will get a stat bonus by attending the graduation party.', [
        {command: 'Graduate', action: function() {
          if (self.shiny) {
            askUser('Are you absolutely sure? This is a pretty sweet idol you have here.', [
              {command: 'Yes, graduate', action: graduate},
              {command: 'No, she should stay'},
            ])
          } else {
            graduate()
          }
        }},
        {command: 'Keep'},
      ])
    })

    detailElement.querySelector('.membership .input')!.addEventListener('click', function(e) {
      e.stopPropagation()
      e.preventDefault()

      self.toggleUnitMembership()
      if (self.isInUnit() !== (e.currentTarget as Element).classList.contains('active')) {
        (e.currentTarget as Element).classList.toggle('active')
      }
      deferRerender()
    })

    detailElement.querySelector('a.favourite')!.addEventListener('click', function(e) {
      e.stopPropagation()
      e.preventDefault()

      self.favourite = !self.favourite;
      (e.target as Element).classList.toggle('selected')
      deferRerender()
    })
  }
  next(mod = 0) {
    const sc = agency.sortedCatalog()
    return sc[sc.indexOf(this) + (mod || 1)]
  }
  prev() { return this.next(-1) }
  audition() {
    const self = this
    const layerTimeout = 400
    let currentLayer = 0
    let auditionLayers: HTMLImageElement[]

    auditionSpace.innerHTML = auditionTemplate(this, {allowedProtoMethods: {
      isShadow: true
    }})
    setTimeout(function() {
      initSparkle(document.getElementById('sparkle-canvas') as HTMLCanvasElement)
    }, 1)

    function addLayerToAuditionPortrait() {
      const portraitElement = document.querySelector('#audition .portrait')
      if (!portraitElement) return

      const part = auditionLayers[currentLayer]
      if (!part) return

      portraitElement.appendChild(part)
      setTimeout(function() { part.classList.add('visible') }, 1)
      currentLayer++
      setTimeout(addLayerToAuditionPortrait, layerTimeout)
    }

    function showLayersGradually() {
      auditionLayers = self.loadedImages.med!
      setTimeout(addLayerToAuditionPortrait, layerTimeout)
    }

    setTimeout(function() {
      self.deferRendering('med', showLayersGradually)
    }, 1)

    document.getElementById('catch-button')!.addEventListener('click', function(e) {
      e.stopPropagation()
      e.preventDefault()
      auditionSpace.innerHTML = ''
      self.showDetail()
      agency.grantExperience(5)
    })
  }
  dump() {
    const idolDump: IdolDump = {
      a: this.recruitedAt,
      b: [],
      f: this.favourite,
      i: this.seed,
      r: this.shiny,
      s: {
        attack: this.stats.attack,
        speed: this.stats.speed,
        defense: this.stats.defense,
      },
    }
    return idolDump
  }
  handleOverrides() {
    // look, we need _somewhere_ to hide our easter eggs
    const override = SEED_OVERRIDES[this.seed]
    if (override !== undefined) {
      override(this)
      this.seedOverride = 'shadow'  // XXX this will have to change if we introduce more overrides
    }
  }
  isShadow() {
    return this.seedOverride === 'shadow'
  }
}

function hideIdolDetail(event: Event) {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  detailElement.classList.remove('shown')
  document.body.classList.remove('overlay')
  currentlyShowingDetail = undefined
}
function showNextIdol(event: Event) {
  if (!currentlyShowingDetail) return
  const nextIdol = currentlyShowingDetail.next()
  if (nextIdol) nextIdol.showDetail()
}
function showPrevIdol(event: Event) {
  if (!currentlyShowingDetail) return
  const prevIdol = currentlyShowingDetail.prev()
  if (prevIdol) prevIdol.showDetail()
}
const keyHandlers = new Map([
  ['ArrowLeft', showPrevIdol],
  ['ArrowRight', showNextIdol],
  ['Escape', hideIdolDetail],
])

document.addEventListener('keydown', function(event) {
  const handler = keyHandlers.get(event.key)
  if (handler) {
    event.preventDefault()
    event.stopPropagation()
    handler(event)
  }
})

// XXX reinstate these gestures
// var hammerManager = new Hammer(document.body);
// hammerManager.on('swipeleft', showNextIdol);
// hammerManager.on('swiperight', showPrevIdol);

Handlebars.registerHelper('ifPositive', function(this: Handlebars.HelperDelegate, a, options) {
  if (a >= 0) return options.fn(this)
  else return options.inverse(this)
})

class Agency {
  catalog: Idol[]
  unit: Idol[]
  recentlyFired: number[]
  experience: number
  storyChaptersBeaten: number
  quickBattleRanking: number
  storySetting: string | null = null
  storyActors: Record<string, string>
  upgrades: UpgradesRecord = {attack: 0, defense: 0, speed: 0, recruitment: 0, graduation: 0}
  sortOrder: IdolSortOrder
  upgradeFor: Record<StatType, () => number>

  constructor() {
    const self = this
    this.catalog = []
    this.unit = []
    this.recentlyFired = []
    for (const upgradeName in upgradeNames) this.upgrades[upgradeName as UpgradeType] = 0

    this.sortOrder = 'date'

    this.experience = 0
    this.storyChaptersBeaten = 0
    this.quickBattleRanking = 0

    this.storyActors = {}

    function upgradeGetter(stat: StatType) {
      return function(): number {
        return self.levelFloor() * self.upgrades[stat]!
      }
    }
    this.upgradeFor = {
      attack: upgradeGetter('attack'),
      speed: upgradeGetter('speed'),
      defense: upgradeGetter('defense'),
    }
  }

  full() {
    return this.catalog.length >= MAXIMUM_CATALOG_SIZE
  }
  renderCatalog() {
    const sortedCatalog = this.sortedCatalog()

    const sortOrders: SortOrder[] = []

    for (const key in idolSortNames) {
      sortOrders.push({
        key: key as IdolSortOrder,
        name: idolSortNames[key as IdolSortOrder],
        selected: (this.sortOrder === key)
      })
    }

    sortOrders.sort()

    const upgrades = []

    for (const upgradeName in upgradeNames) {
      upgrades.push({
        name: upgradeName,
        verboseName: upgradeNames[upgradeName as UpgradeType].name,
        description: upgradeNames[upgradeName as UpgradeType].description,
        currentLevel: this.upgrades[upgradeName as UpgradeType]
      })
    }

    catalogElement.innerHTML = catalogTemplate({
      'hasNeverScannedAnything': (this.catalog.length === 0) && document.body.classList.contains('nothing-scanned'),
      'catalog': sortedCatalog,
      'canFeed': this.canFeed(),
      'levelFloor': this.levelFloor(),
      'levelProgressPercent': Math.floor(this.levelProgress() * 100),
      'quickBattleRanking': this.quickBattleRanking + 1,
      'spendableLevels': this.spendableLevels(),
      'upgrades': upgrades,
      'sortOrder': this.sortOrder,
      'sortOrders': sortOrders,
      'backupUrl': 'data:application/x-idol-threat-save;name=idol-threat.save;charset=utf-8,' + encodeURIComponent(btoa(JSON.stringify(this.dump()))),
      'builtAt': document.body.getAttribute('data-built-at'),
      'credits': getCredits()
    }, {
      allowedProtoMethods: {
        isInUnit: true,
        thumbSpriteHTML: true
      }
    })

    function setSortOrder(event: Event) {
      event.stopPropagation()
      event.preventDefault()
      agency.sortOrder = (event.currentTarget as HTMLElement).getAttribute('data-sort-order') as IdolSortOrder
      rerender()
    }

    document.getElementById('sort-button')!.addEventListener('click', function(event) {
      event.stopPropagation()
      event.preventDefault()
      document.getElementById('agency-meta')!.classList.remove('upgrade-visible')
      document.getElementById('agency-meta')!.classList.toggle('sort-visible')
    })

    document.getElementById('agency-summary')!.addEventListener('click', function(event) {
      event.stopPropagation()
      event.preventDefault()
      document.getElementById('agency-meta')!.classList.remove('sort-visible')
      document.getElementById('agency-meta')!.classList.toggle('upgrade-visible')
    })

    for (const sortKey in idolSortNames) {
      const sortElement = document.querySelector('#sort-list a[data-sort-order="' + sortKey + '"]')
      if (sortElement) sortElement.addEventListener('click', setSortOrder)
    }

    var agency = this

    const inputs = document.querySelectorAll('#catalog li.idol .input')

    function toggleMembership(event: Event) {
      event.stopPropagation()
      event.preventDefault()
      i = parseInt((event.currentTarget as HTMLElement).getAttribute('data-index')!, 10)
      sortedCatalog[i].toggleUnitMembership()
    }

    for (var i = 0, n = inputs.length; i < n; i++) {
      const element = inputs[i]
      element.addEventListener('click', toggleMembership)
    }

    const upgradeButtons = document.querySelectorAll('#upgrade-list a[data-upgrade-name]')

    function upgradeAgency(event: Event) {
      event.stopPropagation()
      event.preventDefault()
      if (agency.spendableLevels() <= 0) {
        askUser('You have no points to spend. Level up your agency some more and try again later.')
        return
      }

      const upgradeName = (event.currentTarget as HTMLElement).getAttribute('data-upgrade-name') as UpgradeType
      agency.upgrades[upgradeName] += 1;
      ((event.currentTarget as HTMLElement).parentElement!.querySelector('.level-counter') as HTMLElement).innerText = agency.upgrades[upgradeName].toString(10)
      document.getElementById('spendable-levels')!.innerText = agency.spendableLevels().toString(10)
      if (agency.spendableLevels() === 0) document.getElementById('agency-meta')!.classList.remove('spendable-levels')
      saveGame()
    }

    for (let k = 0; k < upgradeButtons.length; k++) {
      upgradeButtons[k].addEventListener('click', upgradeAgency)
    }

    const lis = document.querySelectorAll('#catalog li.idol')

    function showDetail(event: Event) {
      event.stopPropagation()
      event.preventDefault()
      i = parseInt((event.currentTarget as HTMLElement).getAttribute('data-index')!, 10)
      sortedCatalog[i].showDetail()
    }

    for (let j = 0, m = lis.length; j < m; j++) {
      const li = lis[j]
      sortedCatalog[j].catalogElement = li
      li.addEventListener('click', showDetail)
    }

    function triggerLoad(event: Event) {
      event.stopPropagation()
      event.preventDefault()
      loadGame.click()
    }
    document.getElementById('load-backup')!.addEventListener('click', triggerLoad)
    function triggerSave(event: Event) {
      event.stopPropagation()
      event.preventDefault()
      window.open((event.currentTarget as HTMLElement).getAttribute('href')!, 'downloadTarget')
    }
    document.getElementById('save-backup')!.addEventListener('click', triggerSave)
    const footerLoad = document.getElementById('footer-load')
    if (footerLoad) footerLoad.addEventListener('click', triggerLoad)

    function toggleCredits(event: Event) {
      if ((event.target as HTMLElement).classList.contains('credited-homepage')) return

      event.stopPropagation()
      event.preventDefault()

      document.getElementById('credits')!.classList.toggle('shown')
    }
    document.getElementById('credits')!.addEventListener('click', toggleCredits)
    document.getElementById('credits-button')!.addEventListener('click', toggleCredits)
  }
  sortedCatalog() {
    const sortedCatalog = []
    for (let i = 0; i < this.catalog.length; i++) {
      sortedCatalog.push(this.catalog[i])
    }
    sortedCatalog.sort(idolSorters[this.sortOrder])
    return sortedCatalog
  }
  renderUnit() {
    const self = this
    const content = unitTemplate(this, {allowedProtoMethods: {
      unitName: true,
      thumbSpriteHTML: true
    }})

    if ((this.unit.length === 0) !== unitElement.classList.contains('empty')) {
      unitElement.classList.toggle('empty')
    }

    unitElement.innerHTML = content
    const unitElements = unitElement.querySelectorAll('.unit li')

    function handleUnitClick(e: Event) {
      e.stopPropagation()
      e.preventDefault()
      self.unit[parseInt((e.currentTarget as HTMLElement).getAttribute('data-index')!, 10)].showDetail()
    }

    for (let ei = 0; ei < unitElements.length; ei++) {
      unitElements[ei].addEventListener('click', handleUnitClick)
    }

    unitDetailElement.innerHTML = unitDetailTemplate(this, {allowedProtoMethods: {
      unitName: true,
      hugeSpriteHTML: true,
      thumbSpriteHTML: true
    }})

    function toggleUnitDetailDisplay(e: Event) {
      e.stopPropagation()
      e.preventDefault()
      unitDetailElement.classList.toggle('hidden')
    }

    document.getElementById('dismiss-unit-details')!.addEventListener('click', toggleUnitDetailDisplay)
    document.getElementById('show-unit-details')!.addEventListener('click', toggleUnitDetailDisplay)
  }
  level() {
    let level = 0
    let xpRemainder = this.experience
    while (xpRemainder >= level) {
      level++
      xpRemainder -= level
    }
    return 1 + level + (xpRemainder / level)
  }
  spendableLevels() {
    let spendableLevels = this.levelFloor()
    for (const upgradeName in this.upgrades) {
      spendableLevels -= this.upgrades[upgradeName as UpgradeType]
    }
    return spendableLevels
  }
  levelFloor() {
    return Math.floor(this.level())
  }
  levelProgress() {
    const level = this.level()
    return level - Math.floor(level)
  }
  grantExperience(count: number) {
    this.experience += count
    deferRerender()
    if (!count) return  // we don't need to congratulate them on this one i don't think

    const indicator = document.createElement('div')
    indicator.classList.add('xp-indicator')
    indicator.innerHTML = count.toString(10) + 'xp'
    indicator.style.left = ((Math.random() * 60) - 30).toString(10) + '%'
    xpIndicatorsElement.appendChild(indicator)

    setTimeout(function() {
      xpIndicatorsElement.removeChild(indicator)
    }, 4000)
  }
  unitName() {
    let unitSeed = 0

    for (let ii = 0; ii < this.unit.length; ii++) {
      unitSeed += this.unit[ii].seed
    }

    const rng = seededRandom(unitSeed)
    return choice(choice(UNIT_NAMES[0], rng()), rng()) + ' ' + choice(choice(UNIT_NAMES[1], rng()), rng())
  }
  addIdol(idol: Idol, interactive: boolean) {
    let blocked = false

    if ((this.catalog.length === 0) && document.body.classList.contains('nothing-scanned')) {
      document.body.removeChild(document.getElementById('title')!)
      document.body.classList.remove('nothing-scanned')
    }

    for(let i = 0, n = this.catalog.length; i < n; i++) {
      if (this.catalog[i].seed === idol.seed) {
        const catalogIdol = this.catalog[i]
        askUser("You recruited this idol already; it's " + idol.name + "!", [
          {command: 'Show me', action: catalogIdol.showDetail.bind(catalogIdol)},
          {command: 'Okay'}
        ])
        blocked = true
        return
      }
    }

    if (blocked) return

    if (this.recentlyFired.indexOf(idol.seed) !== -1) {
      askUser(idol.name + " recently left your agency. Try recruiting some other idols before attempting to recruit her again.")
      return
    }

    this.catalog.push(idol)
    idol.agency = this
    this.addToUnit(idol, false)
    deferRerender()

    if (interactive) {
      idol.audition()
    }
  }
  removeIdol(idol: Idol) {
    if (idol.isInUnit()) idol.toggleUnitMembership()
    agency.catalog.splice(agency.catalog.indexOf(idol), 1)

    agency.recentlyFired.push(idol.seed)
    if (agency.recentlyFired.length > RECENT_FIRING_MEMORY) {
      agency.recentlyFired = agency.recentlyFired.splice(
        agency.recentlyFired.length - RECENT_FIRING_MEMORY,
        RECENT_FIRING_MEMORY
      )
    }

    deferRerender()
  }
  addToUnit(idol: Idol, interactive: boolean) {
    if (this.unit.length >= maxUnitSize) {
      if (interactive) {
        askUser("Your unit is full; you'll need to remove someone before you can add " + idol.name + ".")
      }
    } else {
      this.unit.push(idol)
      if (idol.catalogElement !== undefined) idol.catalogElement.classList.add('active')
    }
  }
  canFeed() {
    return this.catalog.length >= 2
  }
  doStory(pageNumber: number) {
    const self = this
    const chapter = this.getStoryChapter()

    function renderSetting() {
      theatreElement.innerHTML = theatreTemplate({background: self.storySetting})
      const skipButton = theatreElement.querySelector('#skip')!

      function handleSkipClick(event: Event) {
        event.stopPropagation()
        event.preventDefault()
        isSkipping = true
        unbindScriptClick()
        skipButton.removeEventListener('click', handleSkipClick)
        self.doStory(pageNumber + 1)
      }

      skipButton.addEventListener('click', handleSkipClick)
    }

    function getActorElement(actor: Idol): HTMLElement {
      let element = theatreElement.querySelector('#boards .actor[data-actor-name="' + actor.actorName + '"]') as HTMLElement
      if (!element) {
        actor.actorName = actor.actorName
        element = document.createElement('div')
        element.setAttribute('data-actor-name', actor.actorName!)
        element.classList.add('actor')
        element.innerHTML = actor.hugeSpriteHTML()
        theatreElement.querySelector('#boards')!.appendChild(element)
      }
      return element
    }

    if (pageNumber === undefined) {
      pageNumber = 0
      renderSetting() // make boards
      for (let pi = 0; pi < chapter.length; pi++) {
        // preload any idols
        if (chapter[pi].actor !== undefined) {
          console.log(chapter[pi])
          const actor = getBoss(chapter[pi].actor!)
          getActorElement(actor)
        }
      }
    }

    const page = chapter[pageNumber]
    let actorElement: Element

    function graduallyShowScript(visibleScriptElement: HTMLElement, invisibleScriptElement: HTMLElement) {
      function showNextLetter() {
        const nextLetter = invisibleScriptElement.textContent![0]
        visibleScriptElement.textContent += nextLetter
        invisibleScriptElement.textContent = invisibleScriptElement.textContent!.replace(/^./, '')
        if (letterTimeout) clearTimeout(letterTimeout)

        if (!invisibleScriptElement.textContent) {
          letterTimeout = undefined
          return
        }

        let letterDelay = LETTER_DELAY * (LETTER_DELAYS[nextLetter] || 1)
        if (page.em) letterDelay *= LETTER_EMPHASIS_MULTIPLIER
        letterTimeout = setTimeout(showNextLetter, letterDelay)
      }

      letterTimeout = setTimeout(showNextLetter, 50)

      function handleScriptClick(e: Event) {
        e.stopPropagation()
        e.preventDefault()

        if (letterTimeout === undefined) {
          theatreElement.removeEventListener('click', handleScriptClick)
          self.doStory(pageNumber + 1)
        } else {
          clearTimeout(letterTimeout)
          letterTimeout = undefined
          visibleScriptElement.textContent! += invisibleScriptElement.textContent!
          invisibleScriptElement.textContent = ''
        }
      }
      theatreElement.addEventListener('click', handleScriptClick)
      function unbindScriptClick() { theatreElement.removeEventListener('click', handleScriptClick) }
      return unbindScriptClick
    }

    function goToDestination() {
      if (page.adjectives!.into) actorElement.setAttribute('data-position', page.adjectives!.into)
    }

    function handleSetpieceClick(event: Event) {
      event.stopPropagation()
      event.preventDefault()
      self.doStory(pageNumber + 1)
      theatreElement.removeEventListener('click', handleSetpieceClick)
    }

    if (page === undefined) {
      theatreElement.innerHTML = ''
      this.storyChaptersBeaten++
      this.grantExperience(this.storyChaptersBeaten)
      rerender()

    } else if (page.kind === 'setting') {
      this.storySetting = page.value!
      renderSetting()
      this.doStory(pageNumber + 1)

    } else if (page.kind === 'text') {
      if (!theatreElement.innerHTML) renderSetting()
      const stage = document.getElementById('stage')!
      stage.classList.remove('setpiece')
      if (theatreElement.classList.contains('em') !== Boolean(page.em)) theatreElement.classList.toggle('em')

      const currentlySpeakingIdolElements = theatreElement.querySelectorAll('.speaking')
      for (let ci = 0; ci < currentlySpeakingIdolElements.length; ci++) currentlySpeakingIdolElements[ci].classList.remove('speaking')

      if (isSkipping) {
        this.doStory(pageNumber + 1)
      } else {
        const invisibleScriptElement = document.getElementById('invisible-script')!
        const visibleScriptElement = document.getElementById('visible-script')!
        for (let psi = 0; psi < page.speakers!.length; psi++) {
          theatreElement.querySelector('[data-actor-name="' + page.speakers![psi] + '"]')!.classList.add('speaking')
        }
        invisibleScriptElement.textContent = page.text!
        visibleScriptElement.textContent = ''
        unbindScriptClick = graduallyShowScript(visibleScriptElement, invisibleScriptElement)
      }

    } else if (page.kind === 'setpiece') {
      if (!theatreElement.innerHTML) renderSetting()
      theatreElement.addEventListener('click', handleSetpieceClick)
      document.getElementById('setpiece')!.outerHTML = document.getElementById('setpiece')!.outerHTML
      document.getElementById('setpiece')!.innerText = page.text!

      document.getElementById('stage')!.classList.add('setpiece')

    } else if (page.kind === 'direction') {
      if (page.actor !== undefined) {
        const bossActor = getBoss(page.actor!)
        actorElement = getActorElement(bossActor)
        actorElement.classList.remove('exited')

        if (page.adjectives!.rotated) actorElement.setAttribute('data-rotated', page.adjectives!.rotated)

        if (page.verb === 'enter' && page.adjectives!.from) {
          actorElement.setAttribute('data-position', page.adjectives!.from + '-offstage')
          setTimeout(goToDestination, 10)
        } else {
          goToDestination()
        }
      }
      if (page.verb === 'celebrate') celebrate()
      if (page.verb === 'clear') {
        const actorElements = theatreElement.querySelectorAll('#boards .actor')
        for (let aei = 0; aei < actorElements.length; aei++) actorElements[aei].classList.add('exited')
      }

      this.doStory(pageNumber + 1)

    } else if (page.kind === 'battle') {
      isSkipping = false
      theatreElement.innerHTML = ''
      const playerIdols: BattleIdol[] = []

      for (let pii = 0; pii < self.unit.length; pii++) {
        playerIdols.push(new BattleIdol(self.unit[pii], 'player'))
      }

      const enemyIdols: BattleIdol[] = []

      for (let ei = 0; ei < page.bosses!.length; ei++) {
        const enemyIdol = getBoss(page.bosses![ei])
        for (const stat of STATS) {
          enemyIdol.stats[stat] = enemyIdol.stats[stat] + (CHAPTER_DIFFICULTY_INCREASE * this.storyChaptersBeaten)
        }
        enemyIdols.push(new BattleIdol(enemyIdol, 'ai'))
      }

      const battle = new Battle(playerIdols, enemyIdols, function(battle: Battle) {
        for (let pi = 0; pi < battle.playerIdols.length; pi++) {
          battle.playerIdols[pi].idol.giveBonus(enemyIdols.length)
        }

        self.doStory(pageNumber + 1)
      }, function(battle: Battle) {
        theatreElement.innerHTML = ''
        askUser('You lost the battle. Train up your unit some more and try again!')
      }, function(battle: Battle) {
        theatreElement.innerHTML = ''
        askUser('You fled. Try agian when you feel ready.')
      })

      battle.loop()
    }
  }
  getStoryChapter() {
    let chapterName

    chapterName = INITIAL_CHAPTER_ORDER[this.storyChaptersBeaten]

    if (chapterName === undefined) {
      const progressBeyond = this.storyChaptersBeaten - INITIAL_CHAPTER_ORDER.length
      const index = progressBeyond % FINAL_LOOP_ORDER.length
      chapterName = FINAL_LOOP_ORDER[index]
    }

    return CHAPTERS[chapterName]
  }
  dump() {
    const agencyDump: AgencyDump = {
      i: [],
      u: [],
      x: this.experience,
      p: this.upgrades,
      b: this.storyChaptersBeaten,
      q: this.quickBattleRanking,
      f: this.recentlyFired,
      o: this.sortOrder
    }

    for(let i = 0, n = this.catalog.length; i < n; i++) {
      const idol = this.catalog[i]
      agencyDump.i.push(idol.dump())
      agencyDump.u.push(Number(idol.isInUnit()))
    }

    return agencyDump
  }
  load(agencyDump: AgencyDump) {
    if (agencyDump.o !== undefined) this.sortOrder = agencyDump.o
    this.experience = agencyDump.x || 0
    this.storyChaptersBeaten = agencyDump.b || 0
    this.quickBattleRanking = agencyDump.q || 0
    this.recentlyFired = agencyDump.f || []
    this.upgrades = agencyDump.p || this.upgrades

    for(let i = 0, n = agencyDump.i.length; i < n; i++) {
      const idolDump = agencyDump.i[i]
      const idol = new Idol(idolDump.i)

      idol.recruitedAt = idolDump.a
      idol.favourite = idolDump.f
      idol.shiny = Boolean(idolDump.r)

      for(const stat of STATS) {
        idol.stats[stat] = idolDump.s[stat]!
      }

      this.addIdol(idol, false)

      if (Boolean(agencyDump.u[i]) !== idol.isInUnit()) {
        idol.toggleUnitMembership()
      }
    }
  }
}

function numFromString(str: string): number {
  let total = 0
  for(let i = 0, n = str.length; i < n; i++) {
    const c = str.charCodeAt(i)
    total += (Math.pow(255, i) * c)
  }
  return total
}

function recruitIdolFromBarcodeText(text: string): Idol {
  const idol = new Idol(numFromString(text))
  idol.applyRecruitmentBonuses()
  agency.addIdol(idol, true)
  return idol
}

function getCredits() {
  // please don't mock my very bad shuffle

  const folks = [
    ['Alexander Rennerfelt', 'https://twitter.com/okand'],
    ['Chris Walden', 'https://twitter.com/euricaeris'],
    ['DiGiKerot', 'https://twitter.com/digikerot'],
    ['Peter Shillito', 'https://twitter.com/theshillito'],
    ['William Rennerfelt', 'http://william.rennerfelt.org'],
    ['colons', 'https://colons.co/']
  ]
  const pickedFolkIndices = []

  const shuffledFolks = []
  while (pickedFolkIndices.length < folks.length) {
    const folkIndex = Math.floor(Math.random() * folks.length)
    if (pickedFolkIndices.indexOf(folkIndex) !== -1) continue
    pickedFolkIndices.push(folkIndex)
    const folk = folks[folkIndex]
    shuffledFolks.push({
      'name': folk[0],
      'url': folk[1]
    })
  }

  return shuffledFolks
}

barcodeImage.addEventListener('change', function(e) {
  if (barcodeImage.files === null) { return }
  if (agency.full()) {
    askUser(CATALOG_FULL)
    return
  }

  codeReader.decodeFromImageUrl(window.URL.createObjectURL(barcodeImage.files[0])).then(function(result) {
    recruitIdolFromBarcodeText(result.getText())
  }).catch(function(err) {
    console.log(err)
    askUser(
      "Sorry, we couldn't read a barcode in that picture, please try a clearer photo.",
      [
        {command: 'Try again', action: function() { barcodeImage.click() }},
        {command: 'Cancel'}
      ]
    )
  })
})

function complainAboutBadSaveFile() {
  askUser("We couldn't load this save file, sorry. Try another one, or perhaps send us the file and we'll see if we can help.")
}

loadGame.addEventListener('change', function(e) {
  if (loadGame.files === null) { return }

  const reader = new FileReader()
  reader.onload = function() {
    if (reader.result === null) { return }

    const newAgency = new Agency()
    try {
      newAgency.load(JSON.parse(atob(reader.result as string)))
    } catch (e) {
      complainAboutBadSaveFile()
      console.log(e)
      return
    }

    askUser('Loaded save successfully!')
    agency = newAgency
    rerender()
  }

  reader.onerror = complainAboutBadSaveFile
  const file = loadGame.files[0]
  reader.readAsText(file, 'ascii')
  loadGame.value = ''
})

var agency = new Agency()

function recruit() {
  if (CAMERA_DENIED) {
    barcodeImage.click()
    return
  }

  scannerOverlay.classList.remove('hidden')

  // try to use a live video feed
  BrowserQRCodeReader.listVideoInputDevices().then(function(devices) {
    codeReader.decodeFromVideoDevice(undefined, 'scanner-viewfinder', function(result, error, controls) {
      if (result !== undefined) {
        console.log(result)
        controls.stop()
        scannerOverlay.classList.add('hidden')
        recruitIdolFromBarcodeText(result.getText())
      }

      if (error !== undefined) {
        // this is often spurious; we should try to specifically only catch errors that are problems
        if (error.name === "NotAllowedError") {
          CAMERA_DENIED = true
          scannerOverlay.classList.add('hidden')
          askUser('Without camera access, you will need to provide a static image', [
            {command: 'Load image', action: function() { barcodeImage.click() }},
            {command: 'Never mind'}
          ])
        }
      }
    }).then((controls) => {
      scanningControls = controls
    })
  })

  return
}

function rerender() {
  if (document.body.classList.contains('in-battle')) return  // there's no need to rerender when in battle

  agency.renderCatalog()
  agency.renderUnit()

  document.getElementById('recruit')!.addEventListener('click', function(e) {
    e.stopPropagation()
    e.preventDefault()

    if (agency.full()) askUser(CATALOG_FULL)
    else recruit()
  })

  const fightButton = document.getElementById('fight')
  if (fightButton) fightButton.addEventListener('click', function(e) {
    e.stopPropagation()
    e.preventDefault()
    if (agency.unit.length > 0) {
      const playerIdols = []
      for (let pi = 0; pi < agency.unit.length; pi++) {
        playerIdols.push(new BattleIdol(agency.unit[pi], 'player'))
      }

      const enemyIdols = []
      for (let ei = maxUnitSize; ei > 0; ei--) {
        const enemyIdol = new Idol(Math.random())
        enemyIdol.applyQuickBattleRankingBonuses()
        enemyIdols.push(new BattleIdol(enemyIdol, 'ai'))
      }

      var battle = new Battle(playerIdols, enemyIdols, function(battle) {
        let experienceGained = 0

        experienceGained += 5 * (maxUnitSize - battle.playerIdols.length)

        if (battle.numberOfLivingMembers(battle.playerIdols) === battle.playerIdols.length) {
          experienceGained += 2
        }

        agency.grantExperience(experienceGained)

        for (let pi = 0; pi < playerIdols.length; pi++) {
          battle.playerIdols[pi].idol.giveBonus(enemyIdols.length)
        }

        let ranksUp = battle.numberOfLivingMembers(battle.playerIdols)
        if (!battle.tookDamage(battle.playerIdols)) ranksUp += 2

        agency.quickBattleRanking += ranksUp

        rerender()

        askUser(
          'You win! The Idol Threatstival has ranked up to ' + (agency.quickBattleRanking + 1).toString(10) + '.',
          [{command: 'Yay!' }]
        )
      }, function() {
        let ranksDown = battle.numberOfLivingMembers(battle.enemyIdols)
        if (!battle.tookDamage(battle.enemyIdols)) ranksDown += 2
        agency.quickBattleRanking -= ranksDown
        askUser(
          ':< You lose. The Idol Threatsival has ranked down to ' + (agency.quickBattleRanking + 1).toString(10) + '.',
          [{command: 'Aww, beans…'}],
        )
        rerender()
      }, function() { 
        const deadPlayerIdols = battle.playerIdols.length - battle.numberOfLivingMembers(battle.playerIdols)
        agency.quickBattleRanking -= deadPlayerIdols

        if (deadPlayerIdols) {
          askUser(
            'You fled. Some of your idols died, though, so the Idol Threatsival has ranked down to ' + (agency.quickBattleRanking + 1).toString(10) + '.',
            [{command: 'Aww, beans…'}]
          )
        } else {
          askUser('You fled. Nobody died, so your rank does not change.', [{command: 'Aww, beans…'}])
        }
        rerender()
      })

      battle.loop()
    } else {
      askUser('You need an idol in your unit to fight.')
    }
    return false
  })

  const storyButton = document.getElementById('progress-story')
  if (storyButton) storyButton.addEventListener('click', function(e) {
    e.stopPropagation()
    e.preventDefault()

    if (agency.unit.length > 0) {
      isSkipping = false
      agency.doStory(0)
    } else {
      askUser('You need an idol in your unit to progress in the story.')
    }
  })

  const randomFightButton = document.getElementById('random-fight')
  if (randomFightButton) randomFightButton.addEventListener('click', function(e) {
    e.stopPropagation()
    e.preventDefault()

    const playerIdols = []
    const enemyIdols = []
    for (let i = maxUnitSize; i > 0; i--) {
      enemyIdols.push(new BattleIdol(new Idol(Math.random()), 'ai'))
      playerIdols.push(new BattleIdol(new Idol(Math.random()), 'player'))
    }

    const battle = new Battle(playerIdols, enemyIdols, function() {
      askUser('You win!', [{command: 'Yay!'}])
    }, function() {
      askUser('You lose :<', [{command :'Aww, beans…'}])
    }, function() {
      askUser('You fled', [{command :'Yep'}])
    })

    battle.loop()
  })

  saveGame()
}

function saveGame() {
  const fullStateString = JSON.stringify(agency.dump())
  let stateString = btoa(fullStateString)
  let currentIndex = 0

  while (stateString) {
    const slice = stateString.slice(0, cookieSliceSize)
    stateString = stateString.slice(cookieSliceSize)
    document.cookie = 'state_' + currentIndex.toString(10) + '=' + slice + cookieSuffix
    currentIndex++
  }

  document.cookie = 'state_' + currentIndex.toString(10) + '=' + endString + cookieSuffix

  if (checkSaveTimeout) clearTimeout(checkSaveTimeout)
  checkSaveTimeout = setTimeout(function() {
    if (fullStateString !== getStateCookie()) {
      console.log(fullStateString)
      console.log(getStateCookie())
      askUser('saving failed! this is a bug, so im not sure what to recommend')
    }
  }, 50)
}

function deferRerender() {
  if (rerenderTimeout) clearTimeout(rerenderTimeout)
  rerenderTimeout = setTimeout(rerender, 50)
}

let scanningControls: IScannerControls

function initGame() {
  FastClick.attach(document.body)
  document.getElementById('loading')!.innerText = ''
  parsePresetBarcodes()

  cancelScanningElement.addEventListener('click', function() {
    scanningControls.stop()
    scannerOverlay.classList.add('hidden')
  })

  try {
    const savedStateString = getStateCookie()
    if (savedStateString) {
      const agencyDump = JSON.parse(savedStateString)
      agency.load(agencyDump)
    }
  } catch (e) {
    console.log(e)
    askUser('Your save game failed to load, sorry; try reloading somewhere with a better network connection, maybe? :<')
  }

  rerender()
}

function iconHTML(idol: Idol) {
  return '<div class="icon-container affinity-' + idol.affinity + '"><div class="portrait">' + idol.hugeSpriteHTML() + '</div></div>'
}

const batchMatch = window.location.hash.match(/#batch-(\d+)/)

function resetVh() {
  document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01).toString(10) + 'px')
}

window.addEventListener('resize', resetVh)
resetVh()

if (batchMatch) {
  document.body.classList.remove('nothing-scanned')
  document.body.innerHTML = ''

  const batchCount = parseInt(batchMatch[1], 10)
  const batchElement = document.createElement('div')

  for (let bi = batchCount; bi > 0; bi--) {
    const thisIdol = new Idol(Math.random())
    const thisIdolElement = document.createElement('div')
    thisIdolElement.innerHTML = iconHTML(thisIdol)
    batchElement.appendChild(thisIdolElement)
  }

  document.body.appendChild(batchElement)
  document.body.classList.add('batch')
} else if (window.location.hash === '#icon') {
  const iconIdol = new Idol(Math.random())
  document.body.classList.remove('nothing-scanned')
  document.body.innerHTML = iconHTML(iconIdol)
  document.body.classList.add('icon')
} else {
  document.addEventListener('DOMContentLoaded', function() {
    initGame()
    // document.getElementById('fight').click();
    // document.getElementById('progress-story').click();
    // agency.addIdol(new Idol(Math.random()), true);
  })
}

(window as any).executeInScope = function(thingToExecute: string) {
  eval(thingToExecute)
}
