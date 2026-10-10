'use strict';
const whatsappChoice = document.getElementById('choose-whatsapp');
const whatsappDetails = document.getElementById('whatsapp-details');
const whatsappLink = document.getElementById('open-whatsapp');
function showWhatsApp(show) {
  whatsappDetails.hidden = !show;
  whatsappChoice.setAttribute('aria-expanded', String(show));
  if (show) whatsappLink.focus({ preventScroll: true });
}
whatsappChoice.addEventListener('click', () => showWhatsApp(whatsappDetails.hidden));
document.getElementById('hide-whatsapp').addEventListener('click', () => {
  showWhatsApp(false);
  whatsappChoice.focus();
});
const inquiryForm = document.getElementById('inquiry-form');
const intent = document.getElementById('inquiry-type');
const callFields = document.getElementById('call-fields');
const hireFields = document.getElementById('hire-fields');
const readyPanel = document.getElementById('request-ready');
const replyChannel = document.getElementById('client-channel');
const replyDetails = document.getElementById('client-reply');
const requestStatus = document.getElementById('request-status');
let requestText = '';
function resetDraft() {
  requestText = '';
  readyPanel.hidden = true;
  document.getElementById('send-request').removeAttribute('href');
  document.getElementById('request-fallback').value = '';
  requestStatus.textContent = '';
}
function updateIntent() {
  const isCall = intent.value === 'Discovery call';
  const isHire = intent.value === 'Ready to hire';
  callFields.hidden = !isCall;
  callFields.disabled = !isCall;
  hireFields.hidden = !isHire;
  hireFields.disabled = !isHire;
  document.getElementById('intent-help').textContent = isCall
    ? 'Suggest a couple of times and we’ll agree on a schedule.'
    : isHire
      ? 'Skip the discovery call. Share your scope, preferred start date, and budget so we can discuss the engagement.'
      : 'No call needed. Share your project and choose where you would like me to reply.';
  document.getElementById('prepare-label').textContent = isCall
    ? 'Prepare my call request' : isHire ? 'Prepare my project brief' : 'Prepare my chat inquiry';
  resetDraft();
}
function updateReplyChannel() {
  const needsDetails = replyChannel.value !== 'Email';
  document.getElementById('reply-details-field').hidden = !needsDetails;
  replyDetails.disabled = !needsDetails;
  replyDetails.required = needsDetails;
  replyDetails.placeholder = replyChannel.value === 'WhatsApp'
    ? 'Your WhatsApp number, including country code'
    : 'Your ' + replyChannel.value + ' profile link';
  resetDraft();
}
function applyHashIntent() {
  if (location.hash === '#hire') intent.value = 'Ready to hire';
  else if (location.hash === '#call') intent.value = 'Discovery call';
  else return;
  updateIntent();
}
document.querySelectorAll('[data-inquiry-choice]').forEach(link => {
  link.addEventListener('click', () => {
    intent.value = link.dataset.inquiryChoice;
    updateIntent();
    intent.focus({ preventScroll: true });
  });
});
intent.addEventListener('change', updateIntent);
replyChannel.addEventListener('change', updateReplyChannel);
whatsappLink.addEventListener('click', () => {
  intent.value = 'Chat only';
  updateIntent();
  replyChannel.value = 'WhatsApp';
  updateReplyChannel();
  replyDetails.focus({ preventScroll: true });
});
inquiryForm.addEventListener('input', resetDraft);
inquiryForm.addEventListener('change', resetDraft);
window.addEventListener('hashchange', applyHashIntent);
inquiryForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!inquiryForm.reportValidity()) return;
  const fields = new FormData(inquiryForm);
  const get = key => String(fields.get(key) || '').trim();
  const isCall = get('intent') === 'Discovery call';
  const isHire = get('intent') === 'Ready to hire';
  const intro = isCall ? 'I would like to request a discovery call.'
    : isHire ? 'I would like to hire you for the project below and discuss the details in writing.'
    : 'I would like to discuss a project via chat, without a discovery call.';
  const modeLines = isCall
    ? ['My time zone: ' + get('timezone'), 'Preferred dates and times: ' + get('availability')]
    : isHire
      ? ['Engagement: ' + get('engagement'), 'Preferred start: ' + get('start'), 'Budget / rate: ' + (get('budget') || 'Open to discussion')]
      : [];
  requestText = [
    'Hi Demi,', '', intro, '',
    'Name: ' + get('name'), 'Email: ' + get('email'),
    'Company: ' + (get('company') || 'Not provided'), 'Service: ' + get('service'), '',
    'Project brief: ' + get('project'), '', ...modeLines,
    'Preferred reply channel: ' + get('channel'),
    ...(get('replyDetails') ? ['Reply details: ' + get('replyDetails')] : []), '',
    isCall ? 'Please let me know which time works for you.' : 'Please let me know your availability and the next steps.', '',
    'Sent from the Demarie Moyo portfolio contact page.'
  ].join('\n');
  const subject = (isCall ? 'Discovery call request' : isHire ? 'Ready to hire — project brief' : 'Chat-only project inquiry') + ' — ' + get('name');
  document.getElementById('send-request').href = 'mailto:demadahan@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(requestText);
  document.getElementById('request-fallback').value = requestText;
  document.getElementById('request-fallback').hidden = true;
  requestStatus.textContent = '';
  readyPanel.hidden = false;
  document.getElementById('send-request').focus({ preventScroll: true });
  readyPanel.scrollIntoView({ behavior: 'auto', block: 'nearest' });
});
document.getElementById('copy-request').addEventListener('click', async () => {
  if (!requestText) return;
  try {
    await navigator.clipboard.writeText(requestText);
    requestStatus.textContent = 'Copied. Paste this into your email to demadahan@gmail.com.';
  } catch {
    const box = document.getElementById('request-fallback');
    box.hidden = false;
    box.focus();
    box.select();
    requestStatus.textContent = 'Copy the selected text below, then email it to demadahan@gmail.com.';
  }
});
updateIntent();
updateReplyChannel();
applyHashIntent();
document.getElementById('prepare-request').disabled = false;
