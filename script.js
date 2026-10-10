'use strict';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('is-open', open);
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!navigation.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
});
window.matchMedia('(min-width: 651px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
function selectTab(selected, focus = false) {
  tabs.forEach(tab => {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  });
  if (focus) selected.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectTab(tabs[next], true);
    }
  });
});

const copyButton = document.getElementById('copy-email');
const copyStatus = document.getElementById('copy-status');
let feedbackTimer;
copyButton?.addEventListener('click', async () => {
  clearTimeout(feedbackTimer);
  try {
    await navigator.clipboard.writeText('demadahan@gmail.com');
    copyStatus.textContent = 'Email copied. Let’s connect!';
  } catch {
    copyStatus.textContent = 'Please copy: demadahan@gmail.com';
  }
  feedbackTimer = setTimeout(() => { copyStatus.textContent = ''; }, 7000);
});
