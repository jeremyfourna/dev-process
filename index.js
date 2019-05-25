/* jshint esversion:6 */

////////////////
// Constants //
//////////////

const ASK_DURATION = 'ask-duration';
const FRACTION_TIME = 'fraction-time';
const TYPE_DEV = 'dev';
const TYPE_REVIEW = 'review';
const TYPE_QA = 'qa';
const TYPE_AA_REVIEW = 'aa-review';
const TYPE_RELEASE = 'release';
const ANSWER_SELECTED = 'answer-selected';
const NOTHING = 'NOTHING';

/////////////////
// Definition //
///////////////

const devProcess = {
    firstDev: {
        id: 'first-dev',
        name: 'Development',
        behaviour: ASK_DURATION,
        type: TYPE_DEV,
        nextStep: 'codeReview'
    },
    dev: {
        id: 'dev',
        name: 'Work again on the code',
        type: TYPE_DEV,
        behaviour: FRACTION_TIME,
        fraction: 0.25,
        choices: [{
            title: 'Send your code to review',
            description: 'You hope your code is good enough!',
            target: 'codeReview',
            className: 'success',
            type: ANSWER_SELECTED
        }]
    },
    codeReview: {
        id: 'code-review',
        name: 'Code review',
        type: TYPE_REVIEW,
        behaviour: FRACTION_TIME,
        fraction: 0.33,
        choices: [{
            title: 'Pass code review',
            description: 'The quality of the code is good!',
            target: 'qa',
            className: 'success',
            type: ANSWER_SELECTED
        }, {
            title: 'Fail code review',
            description: 'The quality of the code is not good enough',
            target: 'dev',
            className: 'danger',
            type: ANSWER_SELECTED
        }]
    },
    qa: {
        id: 'qa',
        name: 'QA',
        type: TYPE_QA,
        behaviour: FRACTION_TIME,
        fraction: 0.5,
        choices: [{
            title: 'Pass QA',
            description: 'You respected the functional requirements',
            target: 'aaReview',
            className: 'success',
            type: ANSWER_SELECTED
        }, {
            title: 'Fail QA',
            description: 'Dude, it is full of bugs',
            target: 'dev',
            className: 'danger',
            type: ANSWER_SELECTED
        }]
    },
    regression: {
        id: 'regression',
        name: 'Regression QA',
        type: TYPE_QA,
        behaviour: FRACTION_TIME,
        fraction: 0.25,
        choices: [{
            title: 'Pass Regression',
            description: 'Everything still work',
            target: 'release',
            className: 'success',
            type: ANSWER_SELECTED
        }, {
            title: 'Fail Regression',
            description: 'Dude, it is full of bugs again',
            target: 'dev',
            className: 'danger',
            type: ANSWER_SELECTED
        }]
    },
    demo: {
        id: 'regression',
        name: 'Regression QA',
        type: TYPE_QA,
        behaviour: FRACTION_TIME,
        fraction: 0,
        choices: [{
            title: 'Pass product demo',
            description: 'Your PM is happy',
            target: 'release',
            className: 'demo',
            type: ANSWER_SELECTED
        }, {
            title: 'Fail product demo',
            description: 'Your PM is not happy at all',
            target: 'dev',
            className: 'danger',
            type: ANSWER_SELECTED
        }]
    },
    release: {
        id: 'release',
        name: 'Release',
        type: TYPE_RELEASE,
        behaviour: FRACTION_TIME,
        fraction: 0.1,
        choices: [{
            title: 'Your code is released!!!',
            description: 'Lets go party',
            target: 'itIsOver',
            className: 'success',
            type: ANSWER_SELECTED
        }, {
            title: 'You have conflicts to fix',
            description: 'More work for you',
            target: 'dev',
            className: 'danger',
            type: ANSWER_SELECTED
        }]
    },
    aaReview: {
        id: 'aa-review',
        name: 'Architecture review',
        type: TYPE_AA_REVIEW,
        behaviour: FRACTION_TIME,
        fraction: 0.5,
        choices: [{
            title: 'Pass aa review',
            description: 'The quality of the code is good!',
            target: 'regression',
            className: 'success',
            type: ANSWER_SELECTED
        }, {
            title: 'Fail architecture code review',
            description: 'The architecture of the code is not good enough',
            target: 'dev',
            className: 'danger',
            type: ANSWER_SELECTED
        }]
    },
    itIsOver: {
        id: 'it-is-over',
        name: 'You are done',
        behaviour: NOTHING,
        fraction: 0,
        type: NOTHING
    }
};

////////////////////////////////////
// Generate battle and render it //
//////////////////////////////////

const currentProcess = generateProcess(devProcess, 'firstDev');
currentProcess.render();

////////////
// Utils //
//////////

// render :: (string, string) -> void
function render(domSelector, content) {
    const parser = new DOMParser();
    const doc = R.path(
        ['body', 'innerHTML'],
        parser.parseFromString(content, 'text/html')
    );
    const domElements = document.querySelectorAll(domSelector);

    R.forEach(cur => cur.innerHTML = doc, domElements);
}

// template :: (function, array) -> string
function template(view, list) {
    const mapIndexed = R.addIndex(R.map);

    return R.join('', mapIndexed(view, list));
}

// datasetTransform :: object -> object
function datasetTransform(dataset) {
    const transformations = {
        duration: Number
    };

    return R.evolve(transformations, dataset);
}

function log(content) {
    console.log(...arguments);

    return content;
}

function cleanNumber(number) {
    return R.divide(Math.round(R.multiply(number, 100)), 100);
}

function timeFraction(duration, iteration, number) {
    return duration * number / iteration;
}

function iterationOfStep(currentStepType) {
    return R.cond([
        [R.equals(TYPE_DEV), R.always('iterationDev')],
        [R.equals(TYPE_REVIEW), R.always('iterationReview')],
        [R.equals(TYPE_QA), R.always('iterationQa')],
        [R.equals(TYPE_AA_REVIEW), R.always('iterationAAReview')],
    ])(currentStepType);
}

function variation(before, after) {
    if (before === 0) {
        return 100;
    } else {
        return (after - before) / before * 100;
    }
}

////////////////////
// Battle engine //
//////////////////

function generateProcess(devProcess, firstStep) {
    const p = R.prop(R.__, devProcess);
    const store = {
        devProcess,
        previousChoices: [],
        nextChoice: R.prop(firstStep, devProcess),
        processBaseDuration: 0,
        processTotalDuration: 0,
        iterationDev: 0,
        iterationQa: 0,
        iterationReview: 0,
        iterationAAReview: 0,
        iterationRelease: 0
    };

    return {
        render: () => render('.dev-process', template(wholeDevProcess, [store])),
        durationForProcessStep: duration => {
            store.processBaseDuration = duration;
            store.iterationDev += 1;
            store.processTotalDuration += duration;
            store.previousChoices.push(store.nextChoice);
            store.nextChoice = R.path(['devProcess', R.path(['nextChoice', 'nextStep'], store)], store);
        },
        goToNextStep: target => {
            store[iterationOfStep(R.path(['nextChoice', 'type'], store))] += 1;
            store.processTotalDuration += timeFraction(
                R.prop('processBaseDuration', store),
                R.prop(iterationOfStep(R.path(['nextChoice', 'type'], store)), store) || 1,
                R.path(['nextChoice', 'fraction'], store)
            );
            store.previousChoices.push(store.nextChoice);
            store.nextChoice = R.path(['devProcess', target], store);
        },
        duration: () => cleanNumber(store.processTotalDuration),
        durationAgainstBaseDuration: () => cleanNumber(variation(store.processBaseDuration, store.processTotalDuration))
    };
}


////////////
// Views //
//////////


// attackView :: object -> string
function attackView(attack) {
    // isAttackPossible :: boolean -> null || string
    function isAttackPossible(possibleOrNot) {
        return (possibleOrNot) ? null : 'disabled="true"';
    }

    const p = R.prop(R.__, attack);
    const isPossible = isAttackPossible(battle.canAttack(p('origin'), p('cost')));

    registerEvents(
        [{
            type: 'click',
            funct: registerAttack
        }]
    );

    return `<button
            class="attack"
            ${isPossible}
            data-cost="${p('cost')}"
            data-damage="${p('damage')}"
            data-function-identifier="${MAKE_AN_ATTACK}"
            data-loading="${p('loading')}"
            data-name="${p('name')}"
            data-origin="${p('origin')}"
            data-target="${p('target')}"
            data-type="${p('type')}"
            >
            ${p('name')}
          </button>`;
}

// stackView :: (object, number) -> string
function stackView(nextAttack, index) {
    const p = R.prop(R.__, nextAttack);
    const canRemoveAttackFromStack = (R.equals(0, index)) ? 'disabled="true"' : null;

    registerEvents(
        [{
            type: 'click',
            funct: cancelAttack
        }]
    );

    return `<li>
            ${p('name')}
            <button
              ${canRemoveAttackFromStack}
              data-cost="${p('cost')}"
              data-function-identifier="${CANCEL_AN_ATTACK}"
              data-origin="${p('origin')}"
              data-stack-index="${index}"
              >
              X
            </button>
          </li>`;
}

function nextChoiceView(choice, index) {
    log(choice);
    return R.cond([
        [c => R.equals(R.prop('behaviour', c), NOTHING), nothingView],
        [c => R.equals(R.prop('behaviour', c), ASK_DURATION), askDurationView],
        [c => R.equals(R.prop('behaviour', c), FRACTION_TIME), choiceView]
    ])(choice);
}

function nothingView(choice) {
    return `<h3>You are done!</h3>`
}

function choiceView(choice) {
    const p = R.prop(R.__, choice);

    return `<h3>Next step in the process: ${p('name')}</h3>
            ${template(selectAnswerView, p('choices'))}`;
}

function selectAnswerView(answer) {
    const p = R.prop(R.__, answer);

    registerEvents(
        [{
            type: 'click',
            funct: selectedAnwser
        }]
    );

    return `<button
                class="${p('className')}"
                data-target="${p('target')}"
                data-function-identifier="${p('type')}"
                >
                ${p('title')}<br>${p('description')}
            </button>`;
}

// selectedAnwser :: DOM event -> void
function selectedAnwser(event) {
    const p = R.prop(R.__, datasetTransform(R.path(['target', 'dataset'], event)));

    if (R.equals(p('functionIdentifier'), ANSWER_SELECTED)) {
        currentProcess.goToNextStep(p('target'));
        currentProcess.render();
    }
}

function askDurationView(choice) {
    const p = R.prop(R.__, choice);

    registerEvents(
        [{
            type: 'submit',
            funct: getFormData(ASK_DURATION, saveDuration)
        }]
    );

    return `<h3>Next step in the process: ${p('name')}</h3>
            <form id="${ASK_DURATION}" name="${ASK_DURATION}">
                <div class="form-input">
                    <label for="duration">How long this part of the process should take in <em>hours</em>?</label>
                    <input type="number" min="1" step="1" name="duration" value="8" required="true">
                </div>
                <button type="submit" class="validate-choice">Validate your choice</button>
            </form>`;
}

function saveDuration(event) {
    const properData = datasetTransform(event);

    currentProcess.durationForProcessStep(R.prop('duration', properData));
    currentProcess.render();
}

function previousChoicesView(choice) {
    const p = R.prop(R.__, choice);

    return `<li>${p('name')}</li>`;
}

// wholeDevProcess :: object -> string
function wholeDevProcess(devProcess) {
    const p = R.prop(R.__, devProcess);

    log(devProcess);

    return `<p>Current process duration: ${currentProcess.duration()}, ${currentProcess.durationAgainstBaseDuration()}%</p>
            <p>In number of work days: ${cleanNumber(currentProcess.duration()/8)}</p>
            <div class="previous-choices">
                <h2>List of previous choices</h2>
                <div><ul>${template(previousChoicesView, p('previousChoices'))}</ul></div>
            </div>
            <div class="next-choice">
                <h2>Next choice</h2>
                <div>${template(nextChoiceView, [p('nextChoice')])}</div>
            </div>`;
}

/////////////
// Events //
///////////

// registerEvents :: [object] -> void
function registerEvents(listOfEvents) {
    return R.forEach(cur => {
        const p = R.prop(R.__, cur);
        document.body.addEventListener(p('type'), p('funct'), false);
    }, listOfEvents);
}

// getFormData :: string -> object -> object
function getFormData(formName, callback) {
    // filterRelevantTags :: object -> boolean
    function filterRelevantTags(element) {
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
            return true;
        } else {
            return false;
        }
    }

    // extractData :: (object, object) -> object
    function extractData(accumulator, element) {
        accumulator[getFilledProp(element)] = element.value;
        return accumulator;
    }

    // getFilledProp :: object -> string
    function getFilledProp(element) {
        return (element.name === '') ? element.id : element.name;
    }


    // submitForm :: object -> object
    return function submitForm(event) {
        event.preventDefault();

        const el = document.forms[formName].elements;
        const target = Array.from(el);
        const props = target.filter(filterRelevantTags);
        const data = props.reduce(extractData, {});

        return callback(data);
    };
}
