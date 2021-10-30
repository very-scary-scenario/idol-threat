import * as Handlebars from 'handlebars'

var promptArea = document.getElementById('prompt-area')!;

var promptTemplate = Handlebars.compile(document.getElementById('prompt-template')!.innerHTML);

export function askUser(question, answers) {
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
