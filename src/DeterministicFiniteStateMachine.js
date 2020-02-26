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


export function minimize(dfa) {
  // unreachables later time
  // let reachable_states := {q0};
  // let new_states := {q0};
  // do {
  //     temp := the empty set;
  //     for each q in new_states do
  //         for each c in Σ do
  //             temp := temp ∪ {p such that p = δ(q,c)};
  //         end;
  //     end;
  //     new_states := temp \ reachable_states;
  //     reachable_states := reachable_states ∪ new_states;
  // } while (new_states ≠ the empty set);
  // unreachable_states := Q \ reachable_states;

  // init answer dfa (minimized dfa)

  // all states
  const Q = new Set(dfa.states());
  // accept states
  const F = new Set(dfa.acceptStates);
  // reject states
  const Q_diff_F = new Set([...Q].filter(x => !F.has(x)));
  // paritition initialized by adding accepting/rejecting states
  let P = new Set();
  P.add(Q_diff_F);
  P.add(F);

  // under assumption we are working with complete dfa, here is all of the symbols in the alphabet
  // const big_curly_E = new Set([...dfa.alphabet()]);

  // our working set filled with all (A,x) for every x in the alphabet
  let W = new Set();
  for (let individual_accept_State of dfa.acceptStates) {
    for (let symbol_of_alphabet of dfa.alphabet()) {
      W.add([individual_accept_State, symbol_of_alphabet]);
    }
  }
  console.log('initial P =>', P, ' \n initial W =>', W);
  while (W.size !== 0) {
    // remove an arbitrary element (A, x) from W
    let arbitrary_elment_of_W = Array.from(W);
    let A = arbitrary_elment_of_W[Math.floor(Math.random() * arbitrary_elment_of_W.length)];
    W.delete(A);
    console.log('removing A ', A, ' \n from w, w is ', W);
    let X = new Set();
    const a = A[0];
    const x = A[1];
    for (let [key, value] of Object.entries(dfa.transitions)) {
      for (let [k, v] of Object.entries(value)) {
        if (a === v && x === k) {
          X.add(key);
        }
      }
    }
    // init new set X
    console.log('current list of paths in =>', X);
    for (const Y of P) {
      console.log('X =>', X);
      console.log('Y =>', Y);
      let X_intersect_Y = new Set([...X].filter(Z => Y.has(Z)));
      let Y_diff_X = new Set([...Y].filter(Z => !X.has(Z)));
      console.log('x intersect y =>', X_intersect_Y, 'Y - X =>', Y_diff_X);
      let y_comma_x = Array.from(Y).concat(x);
      let X_intersect_Y_comma_x = Array.from(X_intersect_Y).concat(x);
      let Y_diff_X_comma_x = Array.from(Y_diff_X).concat(x);
      if (X_intersect_Y.size !== 0 && Y_diff_X.size !== 0) {
        P.delete(Y);
        P.add(X_intersect_Y);
        P.add(Y_diff_X);
        console.log('updated P =>', P);
        // console.log(' (A, x) form of Y,x =>', Array.from(Y).concat(x));
        // console.log(' (A, x) form of (X intersect Y, x) =>', Array.from(X_intersect_Y).concat(x));
        // console.log(' (A, x) form of (Y - X, x) =>', Array.from(Y_diff_X).concat(x));
        console.log('does w contain y??? ',W.has(y_comma_x));
        if (W.has(y_comma_x)) {
          W.delete(y_comma_x);
          W.add(X_intersect_Y_comma_x);
          W.add(Y_diff_X_comma_x);
          console.log('updated W =>', W);
        } else {
          if (X_intersect_Y.size <= Y_diff_X.size) {
            W.add(X_intersect_Y_comma_x);
            console.log('updated W =>', W);
          } else {
            W.add(Y_diff_X_comma_x);
            console.log('updated W =>', W);
          }
        }
      }
    }
  }
  console.log('States of minimized dfa are now in P =>', P);
  const acceptStates = [];
  const transitions = {};
  const startState = '';
  const minimized_dfa = new DeterministicFiniteStateMachine({acceptStates, startState, transitions});
  // console.log('minimized_dfa =>', minimized_dfa);
  return dfa;
}
