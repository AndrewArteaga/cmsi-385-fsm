export default class DeterministicFiniteStateMachine {

  /**
   */
  constructor({ transitions, startState, acceptStates }) {
    this.transitions = transitions;
    this.startState = startState;
    this.acceptStates = acceptStates;
  }

  alphabet() {
    return new Set(
      Object.values(this.transitions)
      .map(stateTransitions => Object.keys(stateTransitions))
      .reduce((allSymbols, symbols) => [...allSymbols, ...symbols], [])
    );
  }

  states() {
    return new Set(
      Object.entries(this.transitions)
      .map(([state, stateTransitions]) => [state, Object.values(stateTransitions)].flat())
      .reduce((allStates, states) => [...allStates, ...states], [])
    );
  }

  stateAccepted(state) {
    return this.acceptStates.includes(state);
  }

  /**
   *
   * @returns a string state name
   */
  transition(state, symbol) {
    if(!this.transitions[state]) return;
    return this.transitions[state][symbol];
  }

  accepts(string, state = this.startState) {
    const nextState = this.transition(state, string.charAt(0));
    return (string.length === 0) ? this.stateAccepted(state) :
                                   this.accepts(string.substr(1), nextState);
  }

}

/**
 *
 */
export function cross(dfa1, dfa2, accepts = (dfa1State, dfa2State) => true) {
  const acceptStates = [];
  const transitions = {};
  const alphabet = new Set([...dfa1.alphabet(), ...dfa2.alphabet()]);

  // A function which returns a state name for a state in machine 1 and a state in machine 2 
  const stateName = (state1, state2) => `m1:${state1}xm2:${state2}`;

  const startState = stateName(dfa1.startState, dfa2.startState);
  const unresolvedStates = [{ state: startState, state1: dfa1.startState, state2: dfa2.startState }];

  while(unresolvedStates.length > 0) {
    const { state1, state2, state } = unresolvedStates.pop();

    transitions[state] = {};
    if(accepts(state1, state2)) acceptStates.push(state);

    for(const symbol of alphabet) {
      const nextState1 = dfa1.transition(state1, symbol);
      const nextState2 = dfa2.transition(state2, symbol);

      const nextState = stateName(nextState1, nextState2);
      transitions[state][symbol] = nextState;

      if(!transitions[nextState]) {
        // recording that we need to process this state
        unresolvedStates.push({ state: nextState, state1: nextState1, state2: nextState2 });
      }
    }
  } 

  return new DeterministicFiniteStateMachine({
    acceptStates,
    startState,
    transitions
  });
}

export function union(dfa1, dfa2) {
  return cross(dfa1, dfa2, 
    (state1, state2) => dfa1.stateAccepted(state1) || dfa2.stateAccepted(state2));
}

export function intersection(dfa1, dfa2) {
  return cross(dfa1, dfa2, 
    (state1, state2) => dfa1.stateAccepted(state1) && dfa2.stateAccepted(state2));
}

export function minus(dfa1, dfa2) {
  return cross(dfa1, dfa2, 
    (state1, state2) => dfa1.stateAccepted(state1) && !dfa2.stateAccepted(state2));
}

// done via partitioning, look at this link for better understanding https://www.youtube.com/watch?v=0XaGAkY09Wc
// assumes dfa is complete
export function minimize(dfa) {
  // check if two sets are equal
  function are_they_equal(set_one, set_two) {
    if (set_one.size !== set_two.size) {
      return false;
    } else {
      for (var element of set_one) {
        if (!set_two.has(element)) {
          return false;
        }
      }
    }
    return true;
  }
  // set of all states in dfa
  const Q = new Set(dfa.states());
  // set of all accept states in dfa
  const F = new Set(dfa.acceptStates);
  // set of all the non accept states in dfa
  const Q_diff_F = new Set([...Q].filter(x => !F.has(x)));
  // initial partition set, contains coarsest partition: {accept states} | {non accept states}
  let P = new Set();
  P.add(F);
  P.add(Q_diff_F);
  // work set to update and compare with the partition set
  let W = new Set();
  W.add(F);
  W.add(Q_diff_F);
  // dfa is considered to be minimized if W(k-1), from the previous iteration, is equal to W(k), from current partition
  do {
    // start the algorithm
    for (const partition of P) {
      // compare elements in the set to see if they have equivalence
      // if partition only has one element then it is at its minimal form, so skip
      if (partition.size === 1) {
        continue;
      } else {
        // if partition has more than one element check if elements in partition are equivalent
        for (let e = 0; e < partition.size; e++) {
          // can't compare anything past end of set so break out of loop at last element
          if (e === partition.size - 1) {
            break;
          }
          // comparing the transistions on each input symbol from each set for each letter of the alphabet
          for (const symbol of dfa.alphabet()) {
            let current_state = new Set();
            current_state.add(Array.from(partition)[e]);
            // check to see if transistions for both states are in the same partition
            for (const p of P) {
              // if they are then continue onto the next symbol
              if (p.has(dfa.transitions[Array.from(partition)[e]][symbol]) === p.has(dfa.transitions[Array.from(partition)[e + 1]][symbol])) {
                // just don't do anything
              } else {
                // if not split the partition and add it to the work set and stop the loop
                W.add(current_state);
                W.add(new Set([...partition].filter(X => !current_state.has(X))));
                W.delete(partition);
                break;
              }
            }
          }
        }
      }
    }
    // if the partition and the work set are equal then P contains the most minimized version of the dfa
    if (are_they_equal(P, W)) {
      break;
    }
    // if P and W are not equal, clear P and set it equal to W and reloop
    P.clear();
    P = W;
  }
  while (true);
  //it is minimized but contains dupes so we got remove the dups
  let result = [];
  for (const new_state of W) {
    result.push(Array.from(new_state).join(','));
  }
  const polished_minimized_dfa_states = new Set(result.filter(Boolean));
  // create the new minimized dfa
  let acceptStates = [];
  let transitions = {};
  let startState = '';
  for (const e of polished_minimized_dfa_states) {
    // determining new start state
    if (e.includes(dfa.startState)) {
      startState = e;
    }
    // determining new accept states
    for (let prev_accept_state of dfa.acceptStates) {
      if (e.includes(prev_accept_state)) {
        acceptStates.push(e);
        break;
      }
    }
  }
  // determining the new transistions
  for (const e of polished_minimized_dfa_states) {
    let temp = {};
    for (const symbol of dfa.alphabet()) {
      for (const state of dfa.states()) {
        if (e.includes(state)) {
          for (const new_state of polished_minimized_dfa_states) {
            if (new_state.includes(dfa.transitions[state][symbol])) {
              temp[symbol] = new_state;
            }
          }
        }
      }
    }
    transitions[e] = temp;
  }
  const minimized_dfa = new DeterministicFiniteStateMachine({transitions, startState, acceptStates});
  return minimized_dfa;
}