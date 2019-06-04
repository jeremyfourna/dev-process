/* jshint esversion:6 */

////////////////
// Constants //
//////////////

const isNotNil = R.complement(R.isNil);
const isNotEmpty = R.complement(R.isEmpty);
const mapIndexed = R.addIndex(R.map);


/////////////////
// Definition //
///////////////

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

const devProcess = {
    waitingDev: {
        finish: (iteration, estimate) => ['waitingDevCodeReview', 2 + estimate * 0.125]
    },
    waitingDevCodeReview: {
        finish: (iteration, estimate) => R.cond([
            [R.equals(0), () => flip(0.5, ['fixDevCodeReview', 4], ['techLeadCodeReview', 2 + estimate * 0.125])],
            [R.T, R.always(['techLeadCodeReview', 2 + estimate * 0.125])]
        ])(iteration)
    },
    fixDevCodeReview: {
        finish: (iteration, estimate) => ['techLeadCodeReview', 2 + estimate * 0.125]
    },
    techLeadCodeReview: {
        finish: (iteration, estimate) => R.cond([
            [R.equals(0), R.always(['fixTechLeadCodeReview', 4])],
            [R.equals(1), () => flip(0.3, ['fixTechLeadCodeReview', 2], ['readyForQa', estimate / 2])],
            [R.equals(2), () => flip(0.1, ['fixTechLeadCodeReview', 1], ['readyForQa', estimate / 2])],
            [R.T, R.always(['readyForQa', estimate / 2])]
        ])(iteration)
    },
    fixTechLeadCodeReview: {
        finish: (iteration, estimate) => ['techLeadCodeReview', 2 + estimate * 0.125],
    },
    readyForQa: {
        finish: (iteration, estimate) => R.cond([
            [R.equals(0), R.always(['bugFixQa', estimate / 2])],
            [R.equals(1), () => flip(0.3, ['bugFixQa', 4], ['readyAAReview', estimate / 2])],
            [R.equals(2), () => flip(0.1, ['bugFixQa', 2], ['readyAAReview', estimate / 2])],
            [R.T, R.always(['readyAAReview', estimate / 2])]
        ])(iteration)
    },
    bugFixQa: {
        finish: (iteration, estimate) => ['waitingDevCodeReviewForQA', 1 + estimate * 0.125]
    },
    waitingDevCodeReviewForQA: {
        finish: (iteration, estimate) => R.cond([
            [R.equals(0), () => flip(0.2, ['fixDevCodeReviewForQa', 3], ['techLeadCodeReviewForQa', 1 + estimate * 0.125])],
            [R.T, R.always(['techLeadCodeReviewForQa', 1 + estimate * 0.125])]
        ])(iteration)
    },
    fixDevCodeReviewForQa: {
        finish: (iteration, estimate) => ['techLeadCodeReviewForQa', 1 + estimate * 0.125]
    },
    techLeadCodeReviewForQa: {
        finish: (iteration, estimate) => R.cond([
            [R.equals(0), () => flip(0.3, ['fixTechLeadCodeReviewForQa', 3], ['readyForQa', 3])],
            [R.T, R.always(['readyForQa', 3])]
        ])(iteration)
    },
    fixTechLeadCodeReviewForQa: {
        finish: (iteration, estimate) => ['techLeadCodeReviewForQa', 1]
    },
    readyAAReview: {
        finish: (iteration, estimate) => R.cond([
            [R.equals(0), R.always(['fixAAReview', estimate / 2])],
            [R.equals(1), () => flip(0.5, ['fixAAReview', estimate / 4], ['readyForRegression', estimate / 2])],
            [R.equals(2), () => flip(0.1, ['fixAAReview', estimate / 6], ['readyForRegression', estimate / 2])],
            [R.T, R.always(['readyForRegression', estimate / 2])]
        ])(iteration)
    },
    fixAAReview: {
        finish: (iteration, estimate) => ['readyAAReview', estimate / 4]
    },
    readyForRegression: {
        finish: (iteration, estimate) => R.cond([
            [R.equals(0), () => flip(0.5, ['bugFixRegression', 3], ['readyForDemo', 1])],
            [R.T, R.always(['readyForDemo', 1])]
        ])(iteration)
    },
    bugFixRegression: {
        finish: (iteration, estimate) => ['waitingTechLeadReviewForRegression', 1]
    },
    waitingTechLeadReviewForRegression: {
        finish: (iteration, estimate) => ['waitingAAReviewForRegression', 1]
    },
    waitingAAReviewForRegression: {
        finish: (iteration, estimate) => ['readyForRegression', 2]
    },
    readyForDemo: {
        finish: (iteration, estimate) => R.cond([
            [R.equals(0), () => flip(0.05, ['bugFixDemo', 4], ['readyForRelease', 2])],
            [R.T, R.always(['readyForRelease', 2])]
        ])(iteration)
    },
    bugFixDemo: {
        finish: (iteration, estimate) => ['waitingTechLeadReviewForDemo', 2]
    },
    waitingTechLeadReviewForDemo: {
        finish: (iteration, estimate) => ['waitingAAReviewForDemo', 1]
    },
    waitingAAReviewForDemo: {
        finish: (iteration, estimate) => ['readyForRegression', estimate / 6]
    },
    readyForRelease: {
        finish: (iteration, estimate) => ['shipped', 0]
    }
};

const people = [{
        type: 'dev',
        amount: 4,
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
        amount: 2,
        statusToLookFor: [
            'readyForQa',
            'readyForRegression',
            'readyForDemo'
        ]
    }
];


////////////////////////////////////
// Generate dev process and render it //
//////////////////////////////////

const currentProcess = generateProcess(devProcess, people, 10, Date.now(), 1);
currentProcess.render();
currentProcess.startProcess();


/////////////////////////
// Dev process engine //
///////////////////////

function generateProcess(devProcess, peopleConfiguration, ticketsForEachSprints, startTimeOfWholeProcess, nbOfSprint) {
    const sprintInHours = 80;
    const workToDo = [
        { type: 'feature', amount: ticketsForEachSprints }
    ];
    const p = R.prop(R.__, devProcess);
    const store = {
        devProcess,
        workToDo: generateWork(workToDo),
        people: generatePeople(peopleConfiguration)
    };

    return {
        render: () => render('.dev-process', template(wholeDevProcess, [store])),
        startProcess: () => {
            if ((Date.now() - startTimeOfWholeProcess) / 1000 <= (nbOfSprint - 1) * 10) {
                asyncFunction(newSprint, sprintInHours, ticketsForEachSprints);
            }

            findWorkToDo(R.filter(cur => cur.busy === false, store.people));
        },
        findTaskForPeople: person => {
            const result = R.head(R.filter(cur => R.and(R.equals(cur.busy, false), R.includes(cur.status, person.statusToLookFor)), store.workToDo));

            if (isNotNil(result)) {
                const updatedPeople = R.evolve({
                    busy: R.T,
                    workOn: R.always(result.identifier),
                    restingTime: R.add(addTime(person.startTime)),
                    startTime: R.always(Date.now())
                }, person);
                const updatedTask = R.evolve({
                    busy: R.T,
                    restingTime: R.add(addTime(result.startTime)),
                    startTime: R.always(Date.now())
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
                    workOn: R.always(task.identifier),
                    restingTime: R.add(addTime(result.startTime)),
                    startTime: R.always(Date.now())
                }, result);
                const updatedTask = R.evolve({
                    busy: R.T,
                    restingTime: R.add(addTime(task.startTime)),
                    startTime: R.always(Date.now())
                }, task);

                asyncFunction(finishWork, task.estimate, { person: updatedPeople, task: updatedTask });

                store.people = R.adjust(updatedPeople.index, R.always(updatedPeople), store.people);
                store.workToDo = R.adjust(updatedTask.index, R.always(updatedTask), store.workToDo);
            }
        },
        transition: (person, task) => {
            const newStatusAndEstimate = store.devProcess[task.status].finish(task.iteration);
            const updatedPeople = R.evolve({
                busy: R.F,
                workOn: R.always(null),
                busyTime: R.add(addTime(task.startTime)),
                startTime: R.always(Date.now())
            }, person);
            const updatedTask = R.evolve({
                busy: R.F,
                status: R.always(R.head(newStatusAndEstimate)),
                iteration: R.cond([
                    [() => R.or(R.includes(R.head(newStatusAndEstimate), statusThatIncreaseIteration), R.includes(R.head(newStatusAndEstimate), task.previousStatuses)), R.inc],
                    [() => R.includes(R.head(newStatusAndEstimate), statusThatResetIteration), R.always(0)],
                    [R.T, R.identity]
                ]),
                previousStatuses: R.append(task.status),
                busyTime: R.add(addTime(person.startTime)),
                startTime: R.always(Date.now()),
                estimate: R.always(R.last(newStatusAndEstimate))
            }, task);

            store.people = R.adjust(updatedPeople.index, R.always(updatedPeople), store.people);
            store.workToDo = R.adjust(updatedTask.index, R.always(updatedTask), store.workToDo);

            findWorkToDo([updatedPeople]);
            findPeopleToWork([updatedTask]);

        },
        startNewSprint: nbTickets => {
            const workToDo = [
                { type: 'feature', amount: nbTickets }
            ];

            store.workToDo = R.concat(store.workToDo, generateWork(workToDo, R.length(store.workToDo)));
        }
    };
}

function newSprint(nbTickets) {
    currentProcess.startNewSprint(nbTickets);
    currentProcess.startProcess();
}

function addTime(time) {
    return (Date.now() - time) / 1000;
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
            busyTime: 0,
            restingTime: 0,
            startTime: Date.now(),
            statusToLookFor: R.prop('statusToLookFor', cur),
            type: R.prop('type', cur),
            workOn: null
        }, R.prop('amount', cur)))
    )(peopleConfiguration);
}

function generateWork(workload, currentIndex = 0) {
    return R.compose(
        mapIndexed((cur, index) => R.evolve({
            index: R.always(index + currentIndex),
            identifier: () => r()
        }, cur)),
        R.flatten,
        R.map(cur => R.repeat({
            index: null,
            identifier: null,
            iteration: 0,
            busy: false,
            busyTime: 0,
            restingTime: 0,
            estimate: 8,
            originalEstimate: 8,
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

    return `<div>
                <div id="people">
                    <h2>People in the team</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Type</th>
                                <th>Busy</th>
                                <th>Busy Time (in days)</th>
                                <th>Waiting Time (in days)</th>
                            </tr>
                        <thead>
                        <tbody>
                            ${template(peopleView, devProcess.people)}
                        </tbody>
                        <tfoot>
                            ${template(peopleSummaryView, [devProcess.people])}
                        </tfoot>
                    </table>
                </div>
                <div id="non-busy-tasks">
                    <h2>Tasks waiting</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Status</th>
                                <th>Estimate (in hours)</th>
                                <th>Number of Steps</th>
                                <th>Busy Time (in days)</th>
                                <th>Waiting Time (in days)</th>
                            </tr>
                        <thead>
                        <tbody>
                            ${template(taskView, nonBusyTasks(devProcess.workToDo))}
                        </tbody>
                        <tfoot>
                            ${template(taskSummaryView, [nonBusyTasks(devProcess.workToDo)])}
                        </tfoot>
                    </table>
                </div>
                <div id="tasks-shipped">
                    <h2>Tasks shipped</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Status</th>
                                <th>Estimate (in hours)</th>
                                <th>Number of Steps</th>
                                <th>Busy Time (in days)</th>
                                <th>Waiting Time (in days)</th>
                            </tr>
                        <thead>
                        <tbody>
                            ${template(taskView, shippedTasks(devProcess.workToDo))}
                        </tbody>
                        <tfoot>
                            ${template(taskSummaryView, [shippedTasks(devProcess.workToDo)])}
                        </tfoot>
                    </table>
                </div>
            </div>`;
}

function taskView(task) {
    const p = R.prop(R.__, task);

    return `<tr>
                <td>${p('identifier')}</td>
                <td>${p('status')}</td>
                <td>${p('originalEstimate')}</td>
                <td>${R.length(p('previousStatuses'))}</td>
                <td>${cleanNumber(p('busyTime'))}</td>
                <td>${cleanNumber(p('restingTime'))}</td>
            </tr>`;
}

function taskSummaryView(tasks) {
    const busyTime = R.reduce((prev, cur) => R.add(prev, cur.busyTime), 0, tasks);
    const restingTime = R.reduce((prev, cur) => R.add(prev, cur.restingTime), 0, tasks);
    const nbSteps = R.reduce((prev, cur) => R.add(prev, R.length(cur.previousStatuses)), 0, tasks);

    return `<tr>
                <td colspan="2">Efficiency: <b>${cleanNumber(busyTime/(busyTime+restingTime)*100) || 100}%</b></td>
                <td>${cleanNumber(R.reduce((prev, cur) => R.add(prev, cur.originalEstimate), 0, tasks))}</td>
                <td>${nbSteps} - ${cleanNumber(nbSteps/tasks.length) || 0} avg.</td>
                <td>${cleanNumber(busyTime)} - ${cleanNumber(busyTime/tasks.length) || 0} avg.</td>
                <td>${cleanNumber(restingTime)} - ${cleanNumber(restingTime/tasks.length) || 0} avg.</td>
            </tr>`;
}

function nonBusyTasks(listOfTasks) {
    return R.filter(cur => cur.busy === false && cur.status !== 'shipped', listOfTasks);
}

function shippedTasks(listOfTasks) {
    return R.filter(cur => cur.status === 'shipped', listOfTasks);
}

function peopleView(person) {
    const p = R.prop(R.__, person);

    return `<tr class="${isBusyClass(p('busy'))}">
                <td>${p('identifier')}</td>
                <td>${p('type')}</td>
                <td>${isWorking(p('workOn'))}</td>
                <td>${cleanNumber(p('busyTime'))}</td>
                <td>${cleanNumber(p('restingTime'))}</td>
            </tr>`;
}

function peopleSummaryView(people) {
    const busyTime = R.reduce((prev, cur) => R.add(prev, cur.busyTime), 0, people);
    const restingTime = R.reduce((prev, cur) => R.add(prev, cur.restingTime), 0, people);

    return `<tr>
                <td colspan="3">Efficiency: <b>${cleanNumber(busyTime/(busyTime+restingTime)*100) || 100}%</b></td>
                <td>${cleanNumber(busyTime)} - ${cleanNumber(busyTime/people.length) || 0} avg.</td>
                <td>${cleanNumber(restingTime)} - ${cleanNumber(restingTime/people.length) || 0} avg.</td>
            </tr>`;
}

function isBusyClass(busy) {
    if (busy) {
        return 'person-working';
    } else {
        return 'person-resting';
    }
}

function isWorking(taskId) {
    if (R.isNil(taskId)) {
        return `<span>Waiting</span>`;
    } else {
        return `<span>Working on <b>${taskId}</b></span>`;
    }
}


/////////////
// Events //
///////////

// asyncFunction :: (number, object) -> number
function asyncFunction(functionToApply, delay, params) {
    const hoursInADay = 8;

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
