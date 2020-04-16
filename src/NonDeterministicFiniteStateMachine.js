import DeterministicFiniteStateMachine from './DeterministicFiniteStateMachine';

export const LAMBDA = '';

export default class NonDeterministicFiniteStateMachine extends DeterministicFiniteStateMachine {

  /**
   */
  constructor(description) {
    super(description);
  }
  states() {
    return new Set(
      Object.entries(this.transitions)
      .map(([state, stateTransitions]) => [state, Object.values(stateTransitions)].flat())
      .reduce((allStates, states) => [...allStates, ...states], [])
    );
  }

  /**
   *
   * @returns a string state name
   */
  transition(state, symbol) {
    if (!this.transitions[state]) return [];
    return this.transitions[state][symbol] || [];
  }
  // copied from class
  possibleNextStates(state, symbol) {
    const nextStates = new Set();

    for (const startState of this.reachableFromLambda(state)) {

      for (const nextState of this.transition(startState, symbol)) {
        nextStates.add(nextState);
      }
    }

    for (const nextState of nextStates) {
      for (const nextStateAfterLambda of this.reachableFromLambda(nextState)) {
        nextStates.add(nextStateAfterLambda);
      }
    }
    return nextStates;
  }
  // copied from class
  reachableFromLambda(state, reachable = {}) {
    if (reachable[state]) return;
    reachable[state] = true;

    for (const nextState of this.transition(state, LAMBDA)) {
      this.reachableFromLambda(nextState, reachable);
    }

    return Object.keys(reachable);
  }

  // professor's accept method, potential infinite loop
  profAccepts(string, state = this.startState) {
    if (string.length === 0 && this.stateAccepted(state)) return true;

    const symbol = string.charAt(0);

    for (const nextState of this.possibleNextStates(state, symbol)) {
      if (this.accepts(string.substr(1), nextState)) return true;
    }

    return false;
  }


  // recursion is the easiest way to do this
  accepts(string, state = this.startState) {
    let symbol = string[0];
    let updatedString = string.substr(1);
    let path;
    if (state === 'start') {
      symbol = LAMBDA;
      updatedString = string;
    }
    path = this.transition(state, symbol);
    if (string.length === 0 && this.stateAccepted(state)) {
      return true;
    }
    for (let i = 0; i < path.length; i++) {
      if (this.accepts(updatedString, path[i])) {
        return true;
      }
    }
    return false;
  }
}

export function toDFA(nDFA) {
  let acceptStates = [];
  let transitions = {};
  let startState = nDFA.startState;
  // from stack overflow
  // check if two sets are equal
  function are_they_equal(array1, array2) {
    if (!Array.isArray(array1) && !Array.isArray(array2)) {
        return array1 === array2;
    }

    if (array1.length !== array2.length) {
        return false;
    }

    for (var i = 0, len = array1.length; i < len; i++) {
        if (!are_they_equal(array1[i], array2[i])) {
            return false;
        }
    }

    return true;
  }
  // from stack overflow
  // remove excess elements
  function multiDimensionalUnique(arr) {
    var uniques = [];
    var itemsFound = {};
    for (var i = 0, l = arr.length; i < l; i++) {
        var stringified = JSON.stringify(arr[i]);
        if (itemsFound[stringified]) { continue; }
        uniques.push(arr[i]);
        itemsFound[stringified] = true;
    }
    return uniques;
  }

  let nDFAAlphabet = nDFA.alphabet();
  // can't have the lambda transistion also possibleNextStates and reachableFromLambda fix this issue
  nDFAAlphabet.delete('');
  // console.log('current NDFA ', nDFA);
  // console.log('start state =>', startState);
  // console.log('nDFA alphabet =>', nDFAAlphabet);
  // initial partition set contains the start state
  let P = new Set();
  P.add([startState]);
  // work set to update and compare with the partition set
  let W = new Set();
  W.add([startState]);
  // console.log('initial P', P);
  // console.log('initial W', W);
  do {
    // console.log('P at beginning of iteration', P);
    // go through each new state
    for (const partition of P) {
      // console.log('current partition', partition);
      // go through each symbol of NDFA
      for (const symbol of nDFAAlphabet) {
        // console.log('current symbol', symbol);
        // go through each element of of new states
        let temp = new Set();
        for (const e of partition) {
          // console.log('current element of partition', e);
          // console.log('all paths possible from current symbol including lambdas', [...nDFA.possibleNextStates(e, symbol)]);
          temp.add([...nDFA.possibleNextStates(e, symbol)]);
          // console.log('temp storage', temp);
        }
        let finalNewState = [];
        for (const e of temp) {
          for (const f of e) {
            finalNewState.push(f);
          }
        }
        temp = new Set([finalNewState.filter(function(elem, index, self) {
            return index === self.indexOf(elem);
          })]);
        // console.log('final new state', finalNewState);
        // console.log('final temp storage', temp);
        W = new Set([...W, ...temp]);
      }
      // console.log('new DFA States in W', W);
      // console.log('cleaned up array', multiDimensionalUnique([...W]));
      W = new Set(multiDimensionalUnique([...W]));
    }
    if (are_they_equal([...P],[...W])) {
      // console.log('it broke');
      break;
    }
    // if P and W are not equal, clear P and set it equal to W and reloop
    P.clear();
    P = W;
  } while (true);

  // creating new dfa - works
  let result = [];
  for (const new_state of W) {
    result.push(Array.from(new_state).join(','));
  }
  let polished_dfa_states = new Set(result.filter(Boolean));
  console.log('polished_dfa_states', polished_dfa_states);

  // also removes duplicates causes its weird like that
  // from stack overflow
  let va = [...polished_dfa_states];
  let vb = {};
  let vc = [];
  // console.log('ready to be updated', va);
  for (let i = 0; i < va.length; i++){
      var combined = va[i].split('').sort().join('');
      if (!vb[combined]){
          vc.push(va[i]);
          vb[combined] = true;
      }
  }
  // console.log('at last', new Set(vc));
  const final_dfa_states = new Set(vc);
  // console.log('updated polished_dfa_states', final_dfa_states);
  for (const e of final_dfa_states) {
    // determining new accept states
    for (let prev_accept_state of nDFA.acceptStates) {
      if (e.includes(prev_accept_state)) {
        acceptStates.push(e);
        break;
      }
    }
  }
  // console.log('all states', Object.keys(nDFA.transitions));
  // determining the new transistions
  for (const e of final_dfa_states) {
    let temp = {};
    // console.log(e);
    for (const symbol of nDFAAlphabet) {
      for (const state of Object.keys(nDFA.transitions)) {
        // console.log('current state', state);
        if (e.includes(state)) {
          for (const new_state of final_dfa_states) {
            if (new_state.includes(nDFA.transitions[state][symbol])) {
              temp[symbol] = new_state;
              break;
            }
          }
        }
      }
    }
    transitions[e] = temp;
    // console.log(transitions);
  }
  const convertedNDFA = new DeterministicFiniteStateMachine({transitions, startState, acceptStates});
  // console.log(convertedNDFA);
  return convertedNDFA;
}
