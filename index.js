/* jshint esversion:6 */

////////////////
// Constants //
//////////////

const ASK_DURATION = 'ask-duration';
const FRACTION_DEV_TIME = 'fraction-dev-time';
const TYPE_DEV = 'dev';
const TYPE_REVIEW = 'review';
const TYPE_QA = 'qa';

/////////////////
// Definition //
///////////////

const devProcess = [{
    id: 'first-dev',
    name: 'Development',
    behaviour: ASK_DURATION,
    type: TYPE_DEV
}, {
    id: 'first-code-review',
    name: 'Code Review',
    type: TYPE_REVIEW,
    behaviour: FRACTION_DEV_TIME,
    fraction: 20
}, {
    id: 'first-qa',
    name: 'QA',
    type: TYPE_QA,
    behaviour: FRACTION_DEV_TIME,
    fraction: 25
}];

////////////////////////////////////
// Generate battle and render it //
//////////////////////////////////

const currentProcess = generateProcess(devProcess);
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
        cost: Number,
        damage: Number,
        loading: Number
    };

    return R.evolve(transformations, dataset);
}

function log(content) {
    console.log(...arguments);

    return content;
}

////////////////////
// Battle engine //
//////////////////

function generateProcess(devProcess) {
    const p = R.prop(R.__, devProcess);
    const store = {
        devProcess,
        previousChoices: [],
        nextChoice: R.head(devProcess)
    };

    return {
        render: () => render('.dev-process', template(wholeDevProcess, [store]))
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
        [c => R.equals(R.prop('behaviour', c), ASK_DURATION), R.always('<div>DURATION</div>')],
        [R.T, R.always('<div>AAA</div>')]
    ])(choice);
}

// wholeDevProcess :: object -> string
function wholeDevProcess(devProcess) {
    const p = R.prop(R.__, devProcess);

    log(devProcess);

    return `<div class="previous-choices">
                <h2>List of previous choices</h2>
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
