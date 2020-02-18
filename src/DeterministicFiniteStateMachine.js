export default class DeterministicFiniteStateMachine {

  /**
   */
  constructor({ transitions, startState, acceptStates }) {
    this.transitions = transitions;
    this.startState = startState;
    this.acceptStates = acceptStates;
  }

  states() {
    return Object.keys(this.transitions);
  }

  stateAccepted(state) {
    return this.acceptStates.includes(state);
  }

  /**
   *
   * @returns a string state name
   */
  transition(state, symbol) {
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
export function cross(dfa1, dfa2, acceptanceCriteria = (dfa1State, dfa2State) => true) {
//.... TODO
  // create new fsm
  const crossed_dfa = new DeterministicFiniteStateMachine({});
  let new_start_state = '';
  let new_list_of_accept_states = [];
  let new_transistion_states = {};
  // iterate through both dfas to find new start and all new accept states
  for (let i = 0; i < dfa1.states().length; i++) {
    for (let j = 0; j < dfa2.states().length; j++) {
      if (i === 0 && j === 0) {
        new_start_state = dfa1.states()[i].concat(dfa2.states()[j]);
      }
      if (acceptanceCriteria(dfa1.states()[i], dfa2.states()[j])) {
        new_list_of_accept_states.push(dfa1.states()[i].concat(dfa2.states()[j]));
      }
    }
  }
  // add new start and new accept states
  crossed_dfa.startState = new_start_state;
  crossed_dfa.acceptStates = new_list_of_accept_states;
  // compute transition states
  // use the algorithm from here http://www.iaeng.org/publication/WCECS2010/WCECS2010_pp141-143.pdf
  for (let [key_of_dfa1, value_of_dfa1] of Object.entries(dfa1.transitions)) {
    for (let [key_of_dfa2, value_of_dfa2] of Object.entries(dfa2.transitions)) {
      let crossed_state = {};
      for (let [k, v] of Object.entries(value_of_dfa1)) {
        crossed_state[k] = value_of_dfa1[k].concat(value_of_dfa2[k]);
      }
      new_transistion_states[key_of_dfa1.concat(key_of_dfa2)] = crossed_state;
    }
  }
  // add new transistion states
  crossed_dfa.transitions = new_transistion_states;
  return crossed_dfa;
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
