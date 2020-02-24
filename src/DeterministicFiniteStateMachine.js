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
    
    for(const [state, desc] of Object.entries(this.transitions)) {
      for(const symbol of Object.keys(desc)) {
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
  // P := {F, Q \ F};
  // W := {F, Q \ F};
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
  
  return dfa;
}
