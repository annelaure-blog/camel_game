export class Inventory {
  constructor({ displayElement } = {}) {
    this.items = [];
    this.selectedItem = null;
    this.displayElement = displayElement || null;
  }

  setDisplayElement(element) {
    this.displayElement = element;
    this.render();
  }

  add(item) {
    if (!this.items.includes(item)) {
      this.items.push(item);
      this.render();
    }
  }

  remove(item) {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      if (this.selectedItem === item) {
        this.selectedItem = null;
      }
      this.render();
    }
  }

  has(item) {
    return this.items.includes(item);
  }

  getSelectedItem() {
    return this.selectedItem;
  }

  clearSelection() {
    if (this.selectedItem != null) {
      this.selectedItem = null;
      this.render();
    }
  }

  select(item) {
    if (this.selectedItem === item) {
      this.selectedItem = null;
    } else {
      this.selectedItem = item;
    }
    this.render();
  }

  render() {
    if (!this.displayElement) {
      return;
    }

    this.displayElement.innerHTML = '';
    this.items.forEach((item) => {
      const span = document.createElement('span');
      span.className = 'inventory-item';
      span.textContent = `[${item}]`;
      if (this.selectedItem === item) {
        span.classList.add('active');
      }
      span.addEventListener('click', () => {
        this.select(item);
      });
      this.displayElement.appendChild(span);
    });
  }
}
