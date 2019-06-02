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
    new: {
        ifOK: { type: 'devInProgress', iteration: 0 },
        ifKO: null
    },
    devInProgress: {
        ifOK: { type: 'devCodeReview', iteration: 0 },
        ifKO: null
    },
    devCodeReview: {
        ifOK: { type: 'techLeadCodeReview', iteration: 0 },
        ifKO: { type: 'fixDevCodeReview', iteration: 1 }
    }
};

const people = [
    { type: 'dev', amount: 5, statusToLookFor: ['new', 'devCodeReview', 'fixDevCodeReview'] },
    { type: 'techLead', amount: 1, statusToLookFor: ['techLeadCodeReview'] },
    { type: 'architect', amount: 1 },
    { type: 'qa', amount: 1 },
    { type: 'po', amount: 1 }
];

const workToDo = [
    { type: 'feature', amount: 5 },
    { type: 'bug', amount: 2 }
];

////////////////////////////////////
// Generate dev process and render it //
//////////////////////////////////

const currentProcess = generateProcess(devProcess, people, workToDo);
currentProcess.render();


/////////////////////////
// Dev process engine //
///////////////////////

function generateProcess(devProcess, peopleConfiguration, workload) {
    const p = R.prop(R.__, devProcess);
    const store = {
        devProcess,
        workToDo: generateWork(workload),
        people: generatePeople(peopleConfiguration)
    };

    return {
        render: () => render('.dev-process', template(wholeDevProcess, [store])),
        startProcess: () => findWorkToDo(store.workToDo, store.people),
        updateWorkToDO: work => store.workToDo = work,
        updatePeople: listOfPeople => store.people = listOfPeople,
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

function generatePeople(peopleConfiguration) {
    return R.compose(
        R.flatten,
        R.map(cur => R.repeat({
            type: R.prop('type', cur),
            toDoList: [],
            currentJob: null,
            statusToLookFor: R.prop('statusToLookFor', cur)
        }, R.prop('amount', cur)))
    )(peopleConfiguration);
}

function generateWork(workload) {
    return R.compose(
        R.flatten,
        R.map(cur => R.repeat({
            type: R.prop('type', cur),
            estimate: 8,
            status: 'new',
            duration: 0,
            waitingTime: 0,
            startTime: Date.now()
        }, R.prop('amount', cur)))
    )(workload);
}

function findWorkToDo(workToDo, people) {

}


////////////
// Views //
//////////

function nextChoiceView(choice, index) {
    log(choice);
    return R.cond([
        [c => R.equals(R.prop('behaviour', c), NOTHING), nothingView],
        [c => R.equals(R.prop('behaviour', c), ASK_DURATION), askDurationView],
        [c => R.equals(R.prop('behaviour', c), FRACTION_TIME), choiceView]
    ])(choice);
}

function nothingView(choice) {
    return `<h3>You are done!</h3>`;
}

function choiceView(choice) {
    const p = R.prop(R.__, choice);

    return `<h3>Next step in the process: ${p('name')}</h3>
            <div class="container-button">${template(selectAnswerView, p('choices'))}</div>`;
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
                ${p('title')}
            </button>
            <div class="${p('className')}-description">${p('description')}</div>`;
}

// selectedAnwser :: DOM event -> void
function selectedAnwser(event) {
    const p = R.prop(R.__, datasetTransform(R.path(['target', 'dataset'], event)));

    if (R.equals(p('functionIdentifier'), ANSWER_SELECTED)) {
        currentProcess.goToNextStep(p('target'));
        currentProcess.render();
    }
}

function previousChoicesView(choice) {
    const p = R.prop(R.__, choice);

    return `<li>${p('name')}</li>`;
}

// wholeDevProcess :: object -> string
function wholeDevProcess(devProcess) {
    const p = R.prop(R.__, devProcess);

    log(devProcess);

    return `<p>Hello</p>`;
}


/////////////
// Events //
///////////

// asyncFunction :: (number, object) -> number
function asyncFunction(functionToApply, delay, params) {
    return window.setTimeout(functionToApply, loadingToMillisec(delay), params);
}

// registerEvents :: [object] -> void
function registerEvents(listOfEvents) {
    return R.forEach(cur => {
        const p = R.prop(R.__, cur);
        document.body.addEventListener(p('type'), p('funct'), false);
    }, listOfEvents);
}


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

// loadingToMillisec :: number -> number
function loadingToMillisec(loading) {
    return R.multiply(loading, 1000);
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
