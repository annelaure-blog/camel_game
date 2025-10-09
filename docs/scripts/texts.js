export const TEXTS = {
  camel: {},
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
    talk: {
      bedouins: {
        awaitingWater: 'Traveler, our tea is delayed without fresh water.',
        awaitingWaterWithDates: 'The dates look delicious, but we still need fresh water for the kettle.',
        awaitingDates: 'Thank you for the water! Could you also shake down some dates?',
        gratitude: 'With water and dates, the tea will be perfect. You have our thanks.',
      },
      camel: {
        curious: 'The camel blinks slowly, clearly expecting something interesting to happen.',
        sensesWater: 'The camel sniffs at the bucket of water eagerly.',
        hopeful: 'Everyone is getting ready for tea. Maybe there will be a spare cup for me.',
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
