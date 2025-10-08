export const TEXTS = {
  camel: {
    initialThought: 'hmm... water?',
  },
  me: {
    initialObservation: 'The desert is quiet.',
  },
  interactions: {
    shake: {
      palmTree: {
        noEffect: 'The palm tree sways softly.',
      },
    },
    pickup: {
      bucket: {
        success: 'Got the bucket.',
        missing: 'There is no bucket to pick up.',
        already: 'I already picked up the bucket.',
      },
      dates: {
        success: 'A handful of fresh dates.',
        missing: 'There are no dates on the ground.',
      },
    },
    use: {
      pond: {
        success: 'Filled the bucket with water.',
        missingBucket: 'I need a bucket first.',
        alreadyFull: 'The bucket is already full of water.',
      },
    },
    give: {
      bedouins: {
        nothingSelected: 'What should I hand them?',
        wrongItem: "We don't need that right now.",
        datesBeforeWater: 'Nice.',
        datesAfterWater: 'Wonderful, we can start making the tea now.',
        water: 'Nice.',
      },
    },
  },
  objects: {
    dates: {
      label: 'dates',
    },
  },
};

export function getText(path) {
  const value = path
    .split('.')
    .reduce((current, key) => (current && current[key] != null ? current[key] : undefined), TEXTS);
  return value != null ? value : path;
}
