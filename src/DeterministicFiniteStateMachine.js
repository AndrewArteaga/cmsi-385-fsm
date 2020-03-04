export default class DeterministicFiniteStateMachine {

  /**
   */
  constructor({ transitions, startState, acceptStates }) {
    this.transitions = transitions;
    this.startState = startState;
    this.acceptStates = acceptStates;
  }

  alphabet() {
    const alphabet = new Set();

    for (const [state, desc] of Object.entries(this.transitions)) {
      for (const symbol of Object.keys(desc)) {
        alphabet.add(symbol);
      }
    }

    return alphabet.values();
  }

  states() {
    return new Set(Object.keys(this.transitions));
  }

  stateAccepted(state) {
    return this.acceptStates.includes(state);
  }

  /**
   *
   * @returns a string state name
   */
  transition(state, symbol) {
    if (!this.transitions[state]) return;
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

  while (unresolvedStates.length > 0) {
    const { state1, state2, state } = unresolvedStates.pop();

    transitions[state] = {};
    if (accepts(state1, state2)) acceptStates.push(state);

    for (const symbol of alphabet) {
      const nextState1 = dfa1.transition(state1, symbol);
      const nextState2 = dfa2.transition(state2, symbol);

      const nextState = stateName(nextState1, nextState2);
      transitions[state][symbol] = nextState;

      if (!transitions[nextState]) {
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
  let can_minimize = true;
  console.log('starting partition', P);
  console.log('starting work set', W);
  do {
    // start the algorithm
    for (const partition of P) {
      // compare elements in the set to see if they have equivalence
      // if partition only has one element then it is at its minimal form, so skip
      if (partition.size === 1) {
        continue;
      } else {
        // let counter = 0;
        // if partition has more than one element check if elements in partition are equivalent
        for (let e = 0; e < partition.size; e++) {
          // counter += 1;
          // can't compare anything past end of set so break out of loop at last element
          if (e + 1 === partition.size) {
            break;
          }
          // comparing the transistions on each input symbol from each set for each letter of the alphabet
          for (const symbol of dfa.alphabet()) {
            let current_state = new Set(Array.from(partition)[e]);
            // check to see if transistions for both states are in the same partition
            for (const p of P) {
              // if they are then continue onto the next symbol
              if (p.has(dfa.transitions[Array.from(partition)[e]][symbol]) === p.has(dfa.transitions[Array.from(partition)[e + 1]][symbol])) {
                continue;
              } else {
                // if not split the partition and add it to the work set and stop the loop
                W.add(current_state);
                W.add(new Set([...partition].filter(X => !current_state.has(X))));
                W.delete(partition);
                //console.log(P);
                break;
              }
            }
          }
        }
      }
    }
    // if the partition and the work set are equal then P contains the most minimized version of the dfa
    console.log('updated p', P);
    console.log('updated w', W);
    if (are_they_equal(P, W)) {
      console.log('your new minimized dfa', W);
      can_minimize = false;
    }
    // if P and W are not equal, clear P and set it equal to W and reloop
    P.clear();
    P = W;

  }
  while (can_minimize);

  // create the new minimized dfa
  let acceptStates = [];
  let transitions = {};
  let startState = '';
  for (const e of W) {
    for (const newstate of e) {
      // determining new start state
      if (newstate === dfa.startState) {
        startState = Array.from(e).join().replace(/,/g, ',');
      }
      // determining new accept state
      for (let prev_accept_state of dfa.acceptStates) {
        if (prev_accept_state === newstate) {
          acceptStates.push(Array.from(e).join().replace(/,/g, ','));
          break;
        }
      }
    }
  }
  // for (const e of P) {
  //   let temp = {};
  //   for (let [key, value] of Object.entries(dfa.transitions)) {
  //     for (let [k, v] of Object.entries(value)) {
  //       for (const symbol of dfa.alphabet()) {
  //         temp[symbol] = [...Array.from(P).find(i => i.has(v))].join().replace(/,/g, ',');
  //         // [...Array.from(P).find(v => v.has(value[symbol]))].join().replace(/,/g, ',')
  //         // console.log('ung', [...Array.from(P).find(i => i.has(v))].join().replace(/,/g, ','));
  //         //P.get(P.find(v => v.has(value)));
  //         //break;
  //         console.log(Array.from(e).join().replace(/,/g, ','));
  //         console.log(temp[symbol]);
  //       }
  //       transitions[Array.from(e).join().replace(/,/g, ',')] = temp;
  //       console.log(transitions[Array.from(e).join().replace(/,/g, ',')]);
  //       // break;
  //     }
  //   }
    // transitions[Array.from(e).join().replace(/,/g, ',')] = temp;
  // }
  // console.log(dfa.transitions);

  // remove duplicate entries
  acceptStates = acceptStates.filter( function( item, index, inputArray ) {
    return inputArray.indexOf(item) === index;
  });
  // console.log('new start state =>', startState);
  // console.log('new accept states =>', acceptStates);
  // console.log('new transitions =>', transitions);
  const minimized_dfa = new DeterministicFiniteStateMachine({transitions, startState, acceptStates});
  console.log('minimized_dfa =>', minimized_dfa);
  return dfa;
}
