const inventory = [];
let selectedItem = null;

function addItem(item) {
  if (!inventory.includes(item)) {
    inventory.push(item);
  }
}

function removeItem(item) {
  const index = inventory.indexOf(item);
  if (index !== -1) {
    inventory.splice(index, 1);
  }
}

function hasItem(item) {
  return inventory.includes(item);
}

function getSelectedItem() {
  return selectedItem;
}

function clearSelectedItem() {
  selectedItem = null;
}

function updateInventory(inventoryDisplay) {
  inventoryDisplay.innerHTML = '';
  inventory.forEach((item) => {
    const span = document.createElement('span');
    span.className = 'inventory-item';
    span.textContent = `[${item}]`;
    if (selectedItem === item) {
      span.classList.add('active');
    }
    span.addEventListener('click', () => {
      document.querySelectorAll('.inventory-item').forEach((element) => {
        element.classList.remove('active');
      });
      span.classList.add('active');
      selectedItem = item;
    });
    inventoryDisplay.appendChild(span);
  });
}

export {
  inventory,
  addItem,
  removeItem,
  hasItem,
  getSelectedItem,
  clearSelectedItem,
  updateInventory,
};
