export default class DeterministicFiniteStateMachine {

  /**
   */
  constructor({ transitions, startState, acceptStates }) {
    this.transitions = transitions;
    this.startState = startState;
    this.acceptStates = acceptStates;
  }

  /**
   *
   * @returns a string state name
   */
  transition(state, symbol) {
    return this.transitions[state][symbol];
  }

  /**
   * ORIGINAL SUBMITTED ANSWER BEFORE FORK DELETION
   * @returns whether or not the string the fsm accepts the string
   */
  accepts(string, state = this.startState) {
    for (let i = 0; i < string.length; i++) {
      state = this.transition(state, string.charAt(i));
    }
    return state.includes(this.acceptStates);
  }

  // RECURSIVE ACCEPTANCE SOLUTION
  // isAcceptState(state) {
  //   return this.acceptStates.includes(state);
  // }

  // accepts(string, state = this.startState) {
  //   const nextState = this.transition(state, string.charAt(0));

  //   return (string.length === 0) ? this.isAcceptState(state) :
  //                                  this.accepts(string.substr(1), nextState);
  // }

  // ITERATIVE ACCEPTANCE SOLUTION
  // accepts(string, state = this.startState) {
  //   let currentString = string;
  //   let currentState = state;

  //   while(currentString.length > 0) {
  //     currentState = this.transition(currentState, currentString.charAt(0));
  //     currentString = currentString.substr(1);
  //   }

  //   return this.isAcceptState(currentState);
  // }
}
