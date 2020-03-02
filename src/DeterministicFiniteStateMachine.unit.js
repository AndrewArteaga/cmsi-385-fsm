import DeterministicFiniteStateMachine, { union, intersection, minus, minimize } from './DeterministicFiniteStateMachine';

const tests = {
  startsWith0: {
    minimizable: true,
    description: {
      transitions: {
        S: {
          0: 'A',
          1: 'D',
        },
        A: {
          0: 'A',
          1: 'B',
        },
        B: {
          0: 'A',
          1: 'C',
        },
        D: {
          0: 'D',
          1: 'E',
        },
        E: {
          0: 'D',
          1: 'E',
        },
        C: {
          0: 'A',
          1: 'B',
        },
      },
      startState: 'S',
      acceptStates: ['A', 'B', 'C'],
    },

    tests: {
      accepts: [
        '010',
        '01000',
        '01',
      ],
      rejects: [
        '1', '10'
      ],
    }
  },
  acceptsAll: {
    minimizable: true,
    description: {
      transitions: {
        start: {
          0: 'acceptsAll',
          1: 'seen1',
        },
        seen1: {
          0: 'acceptsAll',
          1: 'seen2',
        },
        seen2: {
          0: 'acceptsAll',
          1: 'seen2',
        },
        acceptsAll: {
          0: 'acceptsAll',
          1: 'acceptsAll',
        },
      },
      startState: 'start',
      acceptStates: ['acceptsAll', 'start', 'seen1', 'seen2'],
    },

    tests: {
      accepts: [
        '110',
        '11000',
        '11',
      ],
      rejects: [
      ],
    }
  },
  startsWith11: {
    minimizable: true,
    description: {
      transitions: {
        start: {
          0: 'dead0',
          1: 'seen1',
        },
        seen1: {
          0: 'dead1',
          1: 'seen11',
        },
        dead0: {
          0: 'dead0',
          1: 'dead0',
        },
        dead1: {
          0: 'dead1',
          1: 'dead1',
        },
        dead11: {
          0: 'dead1',
          1: 'dead1',
        },
        seen11: {
          0: 'seen11',
          1: 'seen11',
        }
      },
      startState: 'start',
      acceptStates: ['seen11'],
    },

    tests: {
      accepts: [
        '110',
        '11000',
        '11',
      ],
      rejects: [
        '1000',
        '1',
      ],
    }
  },
  startsWith11OrLambda: {
    minimizable: true,
    description: {
      transitions: {
        start: {
          0: 'dead0',
          1: 'seen1',
        },
        seen1: {
          0: 'dead1',
          1: 'seen11',
        },
        dead0: {
          0: 'dead0',
          1: 'dead0',
        },
        dead1: {
          0: 'dead1',
          1: 'dead1',
        },
        dead11: {
          0: 'dead1',
          1: 'dead1',
        },
        seen11: {
          0: 'seen11',
          1: 'seen11',
        }
      },
      startState: 'start',
      acceptStates: ['seen11', 'start'],
    },

    tests: {
      accepts: [
        '',
        '110',
        '11000',
        '11',
      ],
      rejects: [
        '1000',
        '1',
      ],
    }
  },
  divBy3: {
    description: {
      transitions: {
        r0: {
          0: 'r0',
          1: 'r1',
        },
        r1: {
          0: 'r2',
          1: 'r0',
        },
        r2: {
          0: 'r1',
          1: 'r2',
        }
      },
      startState: 'r0',
      acceptStates: ['r0'],
    },

    tests: {
      accepts: [
        '00110',
        '11',
      ],
      rejects: [],
    }
  },
  hasthree1s: {
    description: {
      transitions: {
        zero: {
          0: 'zero',
          1: 'one',
        },
        one: {
          0: 'one',
          1: 'two',
        },
        two: {
          0: 'two',
          1: 'three',
        },
        three: {
          0: 'three',
          1: 'toomany',
        },
        toomany: {
          0: 'toomany',
          1: 'toomany',
        },
      },
      startState: 'zero',
      acceptStates: ['three'],
    },

    tests: {
      accepts: [
        '01110',
        '111',
        '0101010',
      ],
      rejects: [
        '011110',
        '1111',
        '01101010',
      ],
    }
  },
  numzerosDivBy3: {
    description: {
      transitions: {
        zero_count_r0: {
          0: 'zero_count_r1',
          1: 'zero_count_r0',
        },
        zero_count_r1: {
          0: 'zero_count_r2',
          1: 'zero_count_r1',
        },
        zero_count_r2: {
          0: 'zero_count_r0',
          1: 'zero_count_r2',
        }
      },
      startState: 'zero_count_r0',
      acceptStates: ['zero_count_r0'],
    },

    tests: {
      accepts: [
        '00110',
        '11',
        '01000001',
      ],
      rejects: [
        '0001101',
        '110',
        '010000001',
      ],
    }
  },

};

for (let i = 0; i < 20; i++) {
  if (i % 3 === 0) {
    tests.divBy3.tests.accepts.push(i.toString(2));
  } else {
    tests.divBy3.tests.rejects.push(i.toString(2));
  }
}


describe('examples', () => {
  for (const [key, desc] of Object.entries(tests)) {
    describe(key, () => {
      test('transition', () => {
        const { description } = desc;

        const fsm = new DeterministicFiniteStateMachine(description);
        for (const [state, stateTransitions] of Object.entries(description.transitions)) {
          for (const [symbol, nextState] of Object.entries(stateTransitions)) {
            expect(fsm.transition(state, symbol)).toEqual(nextState);
          }
        }
      });
      test('accepts / rejects', () => {
        const { description, tests: { accepts, rejects } } = desc;
        const fsm = new DeterministicFiniteStateMachine(description);

        for (const string of accepts) {
          expect(`${string}: true`).toEqual(`${string}: ${fsm.accepts(string)}`);
        }

        for (const string of rejects) {
          expect(`${string}: false`).toEqual(`${string}: ${fsm.accepts(string)}`);
        }
      });
    });
  }
});

describe('cross product', () => {
  for (const [key1, desc1] of Object.entries(tests)) {
    for (const [key2, desc2] of Object.entries(tests)) {
      if (key1 !== key2) {


        describe(`dfa1: ${key1} x dfa2: ${key2}`, () => {

          test('union', () => {
            const dfa1 = new DeterministicFiniteStateMachine(desc1.description);
            const dfa2 = new DeterministicFiniteStateMachine(desc2.description);

            const allTests = [
              ...desc1.tests.accepts,
              ...desc1.tests.rejects,
              ...desc2.tests.accepts,
              ...desc2.tests.rejects,
            ];

            const fsm = union(dfa1, dfa2);
            for (const string of allTests) {
              const expectedResult = dfa1.accepts(string) || dfa2.accepts(string);
              expect(`${string}: ${fsm.accepts(string)}`).toEqual(`${string}: ${expectedResult}`);
            }
          });

          test('intersection', () => {
            const dfa1 = new DeterministicFiniteStateMachine(desc1.description);
            const dfa2 = new DeterministicFiniteStateMachine(desc2.description);

            const allTests = [
              ...desc1.tests.accepts,
              ...desc1.tests.rejects,
              ...desc2.tests.accepts,
              ...desc2.tests.rejects,
            ];

            const fsm = intersection(dfa1, dfa2);
            for (const string of allTests) {
              const expectedResult = dfa1.accepts(string) && dfa2.accepts(string);
              expect(`${string}: ${fsm.accepts(string)}`).toEqual(`${string}: ${expectedResult}`);
            }
          });

          test('minus', () => {
            const dfa1 = new DeterministicFiniteStateMachine(desc1.description);
            const dfa2 = new DeterministicFiniteStateMachine(desc2.description);

            const allTests = [
              ...desc1.tests.accepts,
              ...desc1.tests.rejects,
              ...desc2.tests.accepts,
              ...desc2.tests.rejects,
            ];

            const fsm = minus(dfa1, dfa2);
            for (const string of allTests) {
              const expectedResult = dfa1.accepts(string) && !dfa2.accepts(string);
              expect(`${string}: ${fsm.accepts(string)}`).toEqual(`${string}: ${expectedResult}`);
            }
          });

        });
      }
    }
  }
});

describe('minimize', () => {
  for (const [key, desc] of Object.entries(tests)) {
    test(`minimize(${key})`, () => {
        const { description, tests, minimizable } = desc;
        const dfa = new DeterministicFiniteStateMachine(description);
        const minDfa = minimize(dfa);

        if (minimizable) {
          expect(minDfa.states().size).toBeLessThan(dfa.states().size);
        } else {
          expect(minDfa.states().size).toEqual(dfa.states().size);
        }

        for (const string of [...tests.accepts, ...tests.rejects]) {
          expect(dfa.accepts(string)).toEqual(minDfa.accepts(string));
        }
    });
  }
});
