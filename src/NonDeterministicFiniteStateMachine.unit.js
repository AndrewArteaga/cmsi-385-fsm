import NonDeterministicFiniteStateMachine, { LAMBDA, toDFA } from './NonDeterministicFiniteStateMachine';

const tests = {
  ndfatodfa1: {
    convertToDFA: true,
    description: {
      transitions: {
        q0: {
          0: ['q1', 'q2'],
        },
        q1: {
        },
        q2: {
          0: ['q1', 'q2'],
          1: ['q2'],
        },
      },
      startState: 'q0',
      acceptStates: ['q1'],
    },

    tests: {
      accepts: [
        '0',
      ],
      rejects: [
        '1',
      ],
    }
  },
  ndfatodfa2: {
    convertToDFA: true,
    description: {
      transitions: {
        q0: {
          0: ['q0'],
          1: ['q1', 'q2'],
        },
        q1: {
          0: ['q1', 'q2'],
          1: ['q2'],
        },
        q2: {
          0: ['q0', 'q1'],
          1: ['q1'],
        },
      },
      startState: 'q0',
      acceptStates: ['q2'],
    },

    tests: {
      accepts: [
        '1',
      ],
      rejects: [
        '0',
      ],
    }
  },

  divisibleBy4: {
    convertToDFA: false,
    description: {
      transitions: {
        start: {
          [LAMBDA]: ['zero', 'startWith1'],
        },
        startWith1: {
          0: ['startWith1', 'div2'],
          1: ['startWith1'],
        },
        div2: {
          0: ['div4'],
        },
        zero: {
          0: ['zero'],
        },
      },
      startState: 'start',
      acceptStates: ['div4', 'zero'],
    },

    tests: {
      accepts: [
        '0100',
        '01000',
        '0100',
        '0',
        '',
      ],
      rejects: [
        '10',
        '11',
        '1001011',
      ],
    }
  },
  divisibleBy4InfiniteLambda: {
    convertToDFA: false,
    description: {
      transitions: {
        start: {
          [LAMBDA]: ['zero', 'startWith1'],
        },
        startWith1: {
          0: ['startWith1', 'div2'],
          1: ['startWith1'],
        },
        div2: {
          [LAMBDA]: ['startWith1'],
          0: ['div4'],
        },
        zero: {
          [LAMBDA]: ['start'],
          0: ['zero'],
        },
      },
      startState: 'start',
      acceptStates: ['div4', 'zero'],
    },
    tests: {
      accepts: [
        '0100',
        '01000',
        '0100',
        '0',
        '',
      ],
      rejects: [
        '10',
        '11',
        '1001011'
      ],
    }
  },
};

describe('examples', () => {
  for (const [key, desc] of Object.entries(tests)) {
    describe(key, () => {
      test('transition', () => {
        const { description } = desc;

        const fsm = new NonDeterministicFiniteStateMachine(description);
        for (const [state, stateTransitions] of Object.entries(description.transitions)) {
          for (const [symbol, nextState] of Object.entries(stateTransitions)) {
            expect(fsm.transition(state, symbol)).toEqual(nextState);
          }
        }
      });
      test('accepts / rejects', () => {
        const { description, tests: { accepts, rejects } } = desc;
        const fsm = new NonDeterministicFiniteStateMachine(description);

        for (const string of accepts) {
          expect(`${string}: ${fsm.accepts(string)}`).toEqual(`${string}: true`);
        }

        for (const string of rejects) {
debugger
          expect(`${string}: ${fsm.accepts(string)}`).toEqual(`${string}: false`);
        }
      });
    });
  }
});

describe('toDFA', () => {
  for (const [key, desc] of Object.entries(tests)) {
    test(`toDFA(${key})`, () => {
        const { description, tests, convertToDFA } = desc;
        const nDfa = new NonDeterministicFiniteStateMachine(description);
        const dfa = toDFA(nDfa);

        if(convertToDFA) {
          expect(dfa.states().size).toBeLessThan(nDfa.states().size);
          for(const string of [...tests.accepts, ...tests.rejects]) {
            expect(dfa.accepts(string)).toEqual(nDfa.accepts(string));
          }
        }
    });
  }
});
