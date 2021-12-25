import * as Handlebars from 'handlebars'

var promptArea = document.getElementById('prompt-area')!;

var promptTemplate = Handlebars.compile(document.getElementById('prompt-template')!.innerHTML);

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
    actualAnswers = [{ command: 'Okay' }];
  }

  promptArea.innerHTML = promptTemplate({
    'question': question,
    'answers': answers
  });

  function doAnswer(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    var answerIndex = parseInt((event.currentTarget! as HTMLElement).getAttribute('data-answer-index')!, 10);
    promptArea.innerHTML = '';
    var func = actualAnswers[answerIndex].action;
    if (func) func();
  }

  for (var i = 0; i < actualAnswers.length; i++) {
    promptArea.querySelector('a[data-answer-index="' + i.toString() + '"]')!.addEventListener('click', doAnswer);
  }
}
