'use strict';
const photoDialog = document.getElementById('image-dialog');
let previousPhotoButton;
if (photoDialog) {
  const photo = photoDialog.querySelector('img');
  const title = photoDialog.querySelector('#image-dialog-title');
  const caption = photoDialog.querySelector('.image-dialog-caption');
  document.querySelectorAll('[data-full-image]').forEach(button => {
    button.addEventListener('click', () => {
      if (typeof photoDialog.showModal !== 'function') {
        window.open(button.dataset.fullImage, '_blank', 'noopener');
        return;
      }
      previousPhotoButton = button;
      photo.src = button.dataset.fullImage;
      photo.alt = button.querySelector('img').alt;
      title.textContent = button.dataset.title;
      caption.textContent = button.dataset.caption;
      photoDialog.showModal();
    });
  });
  photoDialog.querySelector('[data-close-image]').addEventListener('click', () => photoDialog.close());
  photoDialog.addEventListener('click', event => { if (event.target === photoDialog) photoDialog.close(); });
  photoDialog.addEventListener('close', () => previousPhotoButton?.focus());
}
