import { createMachine } from 'xstate';

export const zeroEntryMachine = createMachine({
  id: 'zeroEntry',
  initial: 'idle',
  states: {
    idle: { on: { START_PERIOD: 'pulling' } },
    pulling: {
      invoke: { src: 'pullHours', onDone: 'predicting' }
    },
    predicting: {
      invoke: { src: 'runHelix', onDone: 'ready' }
    },
    ready: { type: 'final' }
  }
});
