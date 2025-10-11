const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');

if (mode === 'builder') {
  import('./builder/main.js');
  document.body.dataset.mode = 'builder';
} else {
  import('./main.js');
  document.body.dataset.mode = 'game';
}
