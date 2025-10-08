export function playDialogue(dialogue, onComplete) {
  const box = document.getElementById("dialogue");
  let i = 0;
  function next() {
    if (i >= dialogue.length) {
      box.style.display = "none";
      if (onComplete) onComplete();
      return;
    }
    const { speaker, text, delay } = dialogue[i++];
    box.style.display = "block";
    box.style.background =
      speaker === "me"
        ? "rgba(0,0,0,0.9)"
        : speaker === "camel"
        ? "rgba(255,230,180,0.9)"
        : "rgba(255,255,255,0.9)";
    box.style.color = speaker === "me" ? "#fff" : "#000";
    box.textContent = text;
    setTimeout(next, delay || 2500);
  }
  next();
}
