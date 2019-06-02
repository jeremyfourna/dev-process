/* jshint esversion:6 */

////////////////
// Constants //
//////////////

const isNotNil = R.complement(R.isNil);
const isNotEmpty = R.complement(R.isEmpty);
const mapIndexed = R.addIndex(R.map);
const hoursInADay = 8;
const statusThatIncreaseIteration = [
    'fixDevCodeReview',
    'fixTechLeadCodeReview',
    'bugFixQa',
    'fixDevCodeReviewForQa',
    'fixTechLeadCodeReviewForQa',
    'fixAAReview',
    'bugFixRegression',
    'bugFixDemo'
];
const statusThatResetIteration = [
    'readyForQa',
    'readyAAReview',
    'readyForRegression',
    'readyForDemo',
    'readyForRelease'
];

/////////////////
// Definition //
///////////////

const devProcess = {
    waitingDev: {
        finish: () => 'waitingDevCodeReview'
    },
    waitingDevCodeReview: {
        finish: iteration => R.cond([
            [R.equals(0), () => flip(0.5, 'fixDevCodeReview', 'techLeadCodeReview')],
            [R.T, R.always('techLeadCodeReview')]
        ])(iteration)
    },
    fixDevCodeReview: {
        finish: () => 'techLeadCodeReview'
    },
    techLeadCodeReview: {
        finish: iteration => R.cond([
            [R.equals(0), R.always('fixTechLeadCodeReview')],
            [R.equals(1), () => flip(0.3, 'fixTechLeadCodeReview', 'readyForQa')],
            [R.equals(2), () => flip(0.1, 'fixTechLeadCodeReview', 'readyForQa')],
            [R.T, R.always('readyForQa')]
        ])(iteration)
    },
    fixTechLeadCodeReview: {
        finish: () => 'techLeadCodeReview'
    },
    readyForQa: {
        finish: iteration => R.cond([
            [R.equals(0), R.always('bugFixQa')],
            [R.equals(1), () => flip(0.3, 'bugFixQa', 'readyAAReview')],
            [R.equals(2), () => flip(0.1, 'bugFixQa', 'readyAAReview')],
            [R.T, R.always('readyAAReview')]
        ])(iteration)
    },
    bugFixQa: {
        finish: () => 'waitingDevCodeReviewForQA'
    },
    waitingDevCodeReviewForQA: {
        finish: iteration => R.cond([
            [R.equals(0), () => flip(0.2, 'fixDevCodeReviewForQa', 'techLeadCodeReviewForQa')],
            [R.T, R.always('techLeadCodeReviewForQa')]
        ])(iteration)
    },
    fixDevCodeReviewForQa: {
        finish: () => 'techLeadCodeReviewForQa'
    },
    techLeadCodeReviewForQa: {
        finish: iteration => R.cond([
            [R.equals(0), () => flip(0.3, 'fixTechLeadCodeReviewForQa', 'readyForQa')],
            [R.T, R.always('readyForQa')]
        ])(iteration)
    },
    fixTechLeadCodeReviewForQa: {
        finish: () => 'techLeadCodeReviewForQa'
    },
    readyAAReview: {
        finish: iteration => R.cond([
            [R.equals(0), R.always('fixAAReview')],
            [R.equals(1), () => flip(0.5, 'fixAAReview', 'readyForRegression')],
            [R.equals(2), () => flip(0.1, 'fixAAReview', 'readyForRegression')],
            [R.T, R.always('readyForRegression')]
        ])(iteration)
    },
    fixAAReview: {
        finish: () => 'readyAAReview'
    },
    readyForRegression: {
        finish: iteration => R.cond([
            [R.equals(0), () => flip(0.5, 'bugFixRegression', 'readyForDemo')],
            [R.T, R.always('readyForDemo')]
        ])(iteration)
    },
    bugFixRegression: {
        finish: () => 'waitingTechLeadReviewForRegression'
    },
    waitingTechLeadReviewForRegression: {
        finish: () => 'waitingAAReviewForRegression'
    },
    waitingAAReviewForRegression: {
        finish: () => 'readyForRegression'
    },
    readyForDemo: {
        finish: iteration => R.cond([
            [R.equals(0), () => flip(0.05, 'bugFixDemo', 'readyForRelease')],
            [R.T, R.always('readyForRelease')]
        ])(iteration)
    },
    bugFixDemo: {
        finish: () => 'waitingTechLeadReviewForDemo'
    },
    waitingTechLeadReviewForDemo: {
        finish: () => 'waitingAAReviewForDemo'
    },
    waitingAAReviewForDemo: {
        finish: () => 'readyForRegression'
    },
    readyForRelease: {
        finish: () => 'shipped'
    }
};

const people = [{
        type: 'dev',
        amount: 5,
        statusToLookFor: [
            'waitingDev',
            'waitingDevCodeReview',
            'fixDevCodeReview',
            'fixTechLeadCodeReview',
            'bugFixQa',
            'waitingDevCodeReviewForQA',
            'fixDevCodeReviewForQa',
            'fixTechLeadCodeReviewForQa',
            'fixAAReview',
            'bugFixRegression',
            'bugFixDemo'
        ]
    },
    {
        type: 'techLead',
        amount: 1,
        statusToLookFor: [
            'techLeadCodeReview',
            'techLeadCodeReviewForQa',
            'waitingTechLeadReviewForRegression',
            'waitingTechLeadReviewForDemo'
        ]
    },
    {
        type: 'architect',
        amount: 1,
        statusToLookFor: [
            'readyAAReview',
            'waitingAAReviewForRegression',
            'waitingAAReviewForDemo',
            'readyForRelease'
        ]
    },
    {
        type: 'qa',
        amount: 1,
        statusToLookFor: [
            'readyForQa',
            'readyForRegression',
            'readyForDemo'
        ]
    }
];

const workToDo = [
    { type: 'feature', amount: 10 }
];

////////////////////////////////////
// Generate dev process and render it //
//////////////////////////////////

const currentProcess = generateProcess(devProcess, people, workToDo);
currentProcess.render();
currentProcess.startProcess();


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
        startProcess: () => findWorkToDo(store.people),
        findTaskForPeople: person => {
            const result = R.head(R.filter(cur => R.and(R.equals(cur.busy, false), R.includes(cur.status, person.statusToLookFor)), store.workToDo));

            if (isNotNil(result)) {
                const updatedPeople = R.evolve({
                    busy: R.T,
                    workOn: R.always(result.identifier)
                }, person);
                const updatedTask = R.evolve({
                    busy: R.T
                }, result);

                asyncFunction(finishWork, result.estimate, { person: updatedPeople, task: updatedTask });

                store.people = R.adjust(updatedPeople.index, R.always(updatedPeople), store.people);
                store.workToDo = R.adjust(updatedTask.index, R.always(updatedTask), store.workToDo);
            }
        },
        findPeopleForTask: task => {
            const result = R.head(R.filter(cur => R.and(R.equals(cur.busy, false), R.includes(task.status, cur.statusToLookFor)), store.people));

            if (isNotNil(result)) {
                const updatedPeople = R.evolve({
                    busy: R.T,
                    workOn: R.always(result.identifier)
                }, result);
                const updatedTask = R.evolve({
                    busy: R.T
                }, task);

                asyncFunction(finishWork, task.estimate, { person: updatedPeople, task: updatedTask });

                store.people = R.adjust(updatedPeople.index, R.always(updatedPeople), store.people);
                store.workToDo = R.adjust(updatedTask.index, R.always(updatedTask), store.workToDo);
            }
        },
        transition: (person, task) => {
            log('prev status', task.status, task.iteration);
            const newStatus = store.devProcess[task.status].finish(task.iteration);
            log('new status', newStatus);

            const updatedPeople = R.evolve({
                busy: R.F,
                workOn: R.always(null)
            }, person);
            const updatedTask = R.evolve({
                busy: R.F,
                status: R.always(newStatus),
                iteration: R.cond([
                    [() => R.or(R.includes(newStatus, statusThatIncreaseIteration), R.includes(newStatus, task.previousStatuses)), R.inc],
                    [() => R.includes(newStatus, statusThatResetIteration), R.always(0)],
                    [R.T, R.identity]
                ]),
                previousStatuses: R.append(task.status)
            }, task);

            store.people = R.adjust(updatedPeople.index, R.always(updatedPeople), store.people);
            store.workToDo = R.adjust(updatedTask.index, R.always(updatedTask), store.workToDo);

            findWorkToDo([updatedPeople]);
            findPeopleToWork([updatedTask]);

        }
    };
}

function generatePeople(peopleConfiguration) {
    return R.compose(
        mapIndexed((cur, index) => R.evolve({
            index: R.always(index),
            identifier: () => r()
        }, cur)),
        R.flatten,
        R.map(cur => R.repeat({
            index: null,
            identifier: null,
            busy: false,
            statusToLookFor: R.prop('statusToLookFor', cur),
            type: R.prop('type', cur),
            workOn: null
        }, R.prop('amount', cur)))
    )(peopleConfiguration);
}

function generateWork(workload) {
    return R.compose(
        mapIndexed((cur, index) => R.evolve({
            index: R.always(index),
            identifier: () => r()
        }, cur)),
        R.flatten,
        R.map(cur => R.repeat({
            index: null,
            identifier: null,
            iteration: 0,
            busy: false,
            duration: 0,
            estimate: 8,
            previousStatuses: [],
            startTime: Date.now(),
            status: 'waitingDev',
            type: R.prop('type', cur),
            waitingTime: 0
        }, R.prop('amount', cur)))
    )(workload);
}

function findWorkToDo(people) {
    R.forEach(cur => {
        currentProcess.findTaskForPeople(cur);
    }, people);

    currentProcess.render();
}

function findPeopleToWork(listOfTasks) {
    R.forEach(cur => {
        currentProcess.findPeopleForTask(cur);
    }, listOfTasks);

    currentProcess.render();
}


////////////
// Views //
//////////

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

    return `<p>Hello</p>`;
}


/////////////
// Events //
///////////

// asyncFunction :: (number, object) -> number
function asyncFunction(functionToApply, delay, params) {
    return window.setTimeout(functionToApply, R.divide(loadingToMillisec(delay), hoursInADay), params);
}

// registerEvents :: [object] -> void
function registerEvents(listOfEvents) {
    return R.forEach(cur => {
        const p = R.prop(R.__, cur);
        document.body.addEventListener(p('type'), p('funct'), false);
    }, listOfEvents);
}

function finishWork(data) {
    currentProcess.transition(data.person, data.task);
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

// r :: string
function r() {
    return Math.random().toString(36).substring(7);
}

// flip:: (number, string, string) -> string
function flip(percent, fail, succeed) {
    return R.ifElse(
        R.gte(percent),
        // Fail: percent >= random
        R.always(fail),
        // Succeed: percent < random
        R.always(succeed)
    )(Math.random());
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
