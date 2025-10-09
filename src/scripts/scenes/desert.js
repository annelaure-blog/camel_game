const desertScene = {
  name: 'desert',
  ambients: [
    { id: 'dunes-west-1', text: 'dunes', position: { default: { x: 0.03, y: 0.05 } }, fontScale: 1 },
    { id: 'dunes-west-2', text: 'more dunes', position: { default: { x: 0.15, y: 0.06 } } },
    { id: 'dunes-mid-1', text: 'dunes', position: { default: { x: 0.35, y: 0.07 } } },
    { id: 'dunes-mid-2', text: 'more dunes', position: { default: { x: 0.55, y: 0.05 } } },
    { id: 'dunes-east-1', text: 'dunes', position: { default: { x: 0.75, y: 0.06 } } },
    { id: 'dunes-east-2', text: 'more dunes', position: { default: { x: 0.9, y: 0.07 } } },
    { id: 'dunes-south-1', text: 'dunes', position: { default: { x: 0.1, y: 0.09 } } },
    { id: 'dunes-south-2', text: 'more dunes', position: { default: { x: 0.4, y: 0.1 } } },
    { id: 'dunes-south-3', text: 'dunes', position: { default: { x: 0.7, y: 0.09 } } },
  ],
  labels: {
    'palm tree': {
      text: 'palm tree',
      position: {
        default: { x: 0.08, y: 0.32 },
      },
      size: {
        width: '150px',
        height: '450px',
      },
      fontScale: { default: 2.2 },
      layer: 4,
    },
    carpet: {
      text: 'carpet',
      position: { default: { x: 0.24, y: 0.58 } },
      size: {
        width: '350px',
        height: '250px',
      },
      fontScale: { default: 1.6 },
      layer: 1,
    },
    bedouins: {
      text: 'BEDOUINS',
      position: { default: { x: 0.32, y: 0.54 }, mobile: { x: 0.35, y: 0.44 } },
      size: {
        width: '250px',
        height: '130px',
      },
      fontScale: { default: 1.5, mobile: 1.35 },
      layer: 2,
    },
    camel: {
      text: 'camel',
      position: { default: { x: 0.63, y: 0.39 } },
      size: {
        width: '150px',
        height: '100px',
      },
      fontScale: { default: 1.5 },
      layer: 3,
    },
    pond: {
      text: 'pond',
      position: { default: { x: 0.75, y: 0.42 } },
      size: {
        width: '250px',
        height: '100px',
      },
      fontScale: { default: 1.4 },
      layer: 2,
    },
    bucket: {
      text: 'bucket',
      position: { default: { x: 0.84, y: 0.32 } },
      size: {
        width: '80px',
        height: '50px',
      },
      fontScale: { default: 0.55 },
      layer: 2,
    },
    me: {
      text: 'ME',
      size: {
        width: '80px',
        height: '100px',
      },
      classes: ['label--character'],
    },
  },
};

export { desertScene };
