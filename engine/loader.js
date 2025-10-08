let OBJECT_DEFINITIONS = {};

export async function loadObjectDefinitions() {
  const res = await fetch("./data/objects.json");
  OBJECT_DEFINITIONS = await res.json();
}

export function getObjectDef(id) {
  return OBJECT_DEFINITIONS[id];
}

export async function loadSceneData(id) {
  const res = await fetch(`./data/scenes/${id}.json`);
  return await res.json();
}

export async function loadDialogueData(id) {
  const res = await fetch(`./data/dialogues/${id}`);
  return await res.json();
}

