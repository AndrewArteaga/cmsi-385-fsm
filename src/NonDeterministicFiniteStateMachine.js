import DeterministicFiniteStateMachine from './DeterministicFiniteStateMachine';

export const LAMBDA = '';

export default class NonDeterministicFiniteStateMachine extends DeterministicFiniteStateMachine {

  /**
   */
  constructor(description) {
    super(description);
  }


  /**
   *
   * @returns a string state name
   */
  transition(state, symbol) {
    if (!this.transitions[state]) return [];
    return this.transitions[state][symbol] || [];
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
