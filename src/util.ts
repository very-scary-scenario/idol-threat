import * as Handlebars from 'handlebars'

var promptArea = document.getElementById('prompt-area')!;

var promptTemplate = Handlebars.compile(document.getElementById('prompt-template')!.innerHTML);

export interface Answer {
  command: string
  action?: () => void
}

export function askUser(question: string): void
export function askUser(question: string, answers?: Answer[]): void {
  if (answers === undefined) answers = [{
    command: 'Okay',
  }];

  promptArea.innerHTML = promptTemplate({
    'question': question,
    'answers': answers
  });

  function doAnswer(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    var answerIndex = parseInt(event.currentTarget.getAttribute('data-answer-index'), 10);
    promptArea.innerHTML = '';
    var func = answers[answerIndex].action;
    if (func) func();
  }

  for (var i = 0; i < answers.length; i++) {
    promptArea.querySelector('a[data-answer-index="' + i.toString() + '"]')!.addEventListener('click', doAnswer);
  }
}

export interface Part {
}
