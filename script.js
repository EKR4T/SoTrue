const video = document.getElementById('wildlifeVideo');
const toggleBtn = document.getElementById('toggleBtn');

toggleBtn.addEventListener('click', () => {
  if (video.style.display === 'none') {
    video.style.display = 'block';
    video.play();
  } else if (video.paused) {
    video.play();
  } else {
    video.pause();
    video.style.display = 'none';
  }
});
