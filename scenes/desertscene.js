import { gameState } from "../main.js";
import { handleInteraction } from "../interactions/desertactions.js";

export function loadDesertScene(dialogue) {
  const scene = document.getElementById("scene");
  scene.innerHTML = "";

  const elements = [
    { name: "palm tree", style: "left:5%;top:25%;height:50%;width:80px;background:white;" },
    { name: "carpet", style: "left:20%;top:70%;width:300px;height:100px;background:white;" },
    { name: "bedouins", style: "left:22%;top:60%;width:300px;height:60px;background:#f4e3c2;" },
    { name: "camel", style: "left:60%;top:35%;width:180px;height:60px;background:#e2b980;" },
    { name: "pond", style: "left:65%;top:45%;width:200px;height:60px;background:#87ceeb;" },
    { name: "bucket", style: "left:75%;top:43%;width:20px;height:30px;background:white;" },
    { name: "me", style: "left:50%;top:80%;width:40px;height:70px;background:black;color:white;" }
  ];

  elements.forEach(obj => {
    const div = document.createElement("div");
    div.className = "label";
    div.textContent = obj.name;
    div.style = obj.style;
    div.onclick = () => handleInteraction(obj.name);
    scene.appendChild(div);
  });

  // Add dunes
  for (let i = 0; i < 12; i++) {
    const dune = document.createElement("div");
    dune.className = "ambient";
    dune.textContent = i % 2 === 0 ? "dunes" : "more dunes";
    dune.style = `top:${5 + (i % 3) * 3}%;left:${5 + i * 7}%;font-size:1.1rem;opacity:0.4;`;
    scene.appendChild(dune);
  }

  startIntroDialogue(dialogue);
}

function startIntroDialogue(dialogue) {
  const dialogueBox = document.getElementById("dialogue");
  let i = 0;

  function nextLine() {
    if (i >= dialogue.length) {
      dialogueBox.style.display = "none";
      return;
    }
    const { speaker, text, delay } = dialogue[i];
    dialogueBox.style.display = "block";
    dialogueBox.style.background =
      speaker === "me"
        ? "rgba(0,0,0,0.9)"
        : speaker === "camel"
        ? "rgba(255,230,180,0.9)"
        : "rgba(255,255,255,0.9)";
    dialogueBox.style.color = speaker === "me" ? "white" : "black";
    dialogueBox.textContent = text;
    i++;
    setTimeout(nextLine, delay || 3000);
  }

  nextLine();
}
