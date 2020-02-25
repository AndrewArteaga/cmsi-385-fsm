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
  // unreachables
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



  // Hopcroft
  // \ means set difference so Q \ F is Q - F
  // Q = all states
  // F = all accept states
  // P := {F, Q \ F};
  // W := {F};
  // while (W is not empty) do
  //     choose and remove a set A from W
  //     for each c in Σ do
  //           let X be the set of states for which a transition on c leads to a state in A
  //           for each set Y in P for which X ∩ Y is nonempty and Y \ X is nonempty do
  //               replace Y in P by the two sets X ∩ Y and Y \ X
  //               if Y is in W
  //                     replace Y in W by the same two sets
  //               else
  //                     if |X ∩ Y| <= |Y \ X|
  //                         add X ∩ Y to W
  //                     else
  //                         add Y \ X to W
  //           end;
  //     end;
  // end;

  // init answer dfa (minimized dfa)
  const minimized_dfa = new DeterministicFiniteStateMachine({});
  const Q = new Set(dfa.states());
  // console.log('all states =>', Q);
  const F = new Set(dfa.acceptStates);
  // console.log('accepted states =>', F);
  const Q_diff_F = new Set([...Q].filter(x => !F.has(x)));
  // console.log('Q - F =>', F);
  let P = new Set();
  P.add(F);
  P.add(Q_diff_F);
  //console.log('P =>', P);
  let W = new Set();
  W.add(F);
  W.add(Q_diff_F);
  // console.log('W =>', W);
  const big_curly_E = new Set([...dfa.alphabet()]);
  // console.log('big_curly_E =>', big_curly_E);
  // console.log('W.size =>', W.size);

  while (W.size !== 0) {
    let A = new Set();
    for (let set_from_W of W) {
      A.add(set_from_W);
      W.delete(set_from_W);
      break;
    }
    // console.log('Set A is now =>', A);
    // console.log('Set W is now =>', W);
    // let X = new Set();
    for (const c of big_curly_E) {
      let X = new Set();
      for (let set_from_A of A) {
        for (let element of set_from_A) {
          // [...X, ...dfa.transitions[element][c]];
          X.add(dfa.transitions[element][c]);
          // console.log('element in A =>', element);
          // console.log('accessing object properities of items in set A given c =>', dfa.transitions[element][c]);
        }
      }
      console.log('when c = ', c, ' X =>', X);
      for (let Y of P) {
        // console.log('set Y = ', Y);
        let X_intersect_Y = new Set([...X].filter(x => Y.has(x)));
        // console.log('X ∩ Y =>', X_intersect_Y);
        let Y_diff_X = new Set([...Y].filter(x => !X.has(x)));
        // console.log('Y - X =>', Y_diff_X);
        if (X_intersect_Y.size !== 0 && Y_diff_X.size !== 0) {
          // console.log('heyo its true');
          // console.log('set Y = ', Y);
          P.delete(Y);
          P.add(X_intersect_Y);
          P.add(Y_diff_X);
          // console.log('P atm =>', P);
          // console.log('W atm =>', W);
          if (W.has(Y)) {
            // console.log('set Y => ', Y);
            // console.log('heyo its true');
            W.delete(Y);
            W.add(X_intersect_Y);
            W.add(Y_diff_X);
          } else {
            if (X_intersect_Y.size <= Y_diff_X.size) {
              // console.log('huh =>', X_intersect_Y <= Y_diff_X);
              W.add(X_intersect_Y);
            } else {
              W.add(Y_diff_X);
            }
          }
        }
      }
    }
  }
  console.log('States of minimized dfa P =>', P);
  // console.log('States of minimized dfa W =>', W);
  return dfa;
}
