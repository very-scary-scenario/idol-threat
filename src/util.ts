import * as Handlebars from 'handlebars'

const promptArea = document.getElementById('prompt-area')!

const promptTemplate = Handlebars.compile(document.getElementById('prompt-template')!.innerHTML)

export interface ChapterPage {
  kind: string

  // setting
  value?: string

  // stage direction
  adjectives?: Record<string, string> | null
  actor?: string | null
  verb?: string

  // battle
  strength?: number
  bosses?: string[]

  // setpiece & text
  text?: string
  speakers?: string[]
  em?: boolean
}

export interface AbilityPart {
  bonus: number
  healing: boolean
  words: string[]
}

export interface Part {
  path: string
  thumbPath: string
  medPath: string
  bodyType?: string
  layer?: string
  number?: string
  pose?: string | null
  skinColour?: string | null
  hairColour?: string | null
}

export interface Answer {
  command: string
  action?: () => void
}

export function askUser(question: string, answers?: Answer[]): void {
  let actualAnswers: Answer[]

  if (answers !== undefined) {
    actualAnswers = answers
  } else {
    actualAnswers = [{ command: 'Okay' }]
  }

  promptArea.innerHTML = promptTemplate({
    'question': question,
    'answers': actualAnswers
  })

  function doAnswer(event: Event) {
    event.stopPropagation()
    event.preventDefault()
    const answerIndex = parseInt((event.currentTarget! as HTMLElement).getAttribute('data-answer-index')!, 10)
    promptArea.innerHTML = ''
    const func = actualAnswers[answerIndex].action
    if (func) func()
  }

  for (let i = 0; i < actualAnswers.length; i++) {
    promptArea.querySelector('a[data-answer-index="' + i.toString() + '"]')!.addEventListener('click', doAnswer)
  }
}
