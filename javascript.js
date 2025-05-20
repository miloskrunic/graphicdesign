const target = document.querySelector('.three');

const handleOnDown = e => {
  const track = document.getElementById("image-track");
  track.dataset.mouseDownAt = e.clientX;
};

const handleOnUp = () => {
  const track = document.getElementById("image-track");
  track.dataset.mouseDownAt = "0";  
  track.dataset.prevPercentage = track.dataset.percentage;
};

const handleOnMove = e => {
  const track = document.getElementById("image-track");
  const thumb = document.querySelector(".thumb");

  if (track.dataset.mouseDownAt === "0") return;
  
  const mouseDelta = parseFloat(track.dataset.mouseDownAt) - e.clientX,
        maxDelta = window.innerWidth / 2;

  const percentage = (mouseDelta / maxDelta) * -100,
        nextPercentageUnconstrained = parseFloat(track.dataset.prevPercentage) + percentage,
        nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 0), -100);

  track.dataset.percentage = nextPercentage;

  track.animate({
    transform: `translate(${nextPercentage}%, -50%)`
  }, { duration: 1200, fill: "forwards" });

  for (const image of track.getElementsByClassName("image")) {
    image.animate({
      objectPosition: `${100 + nextPercentage}% center`
    }, { duration: 1200, fill: "forwards" });
  }

  const trackWidth = document.querySelector(".track").offsetWidth;
  const thumbPos = (nextPercentage / -100) * trackWidth;
  thumb.style.left = `${thumbPos}px`;
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {

      window.addEventListener("mousedown", handleOnDown);
      window.addEventListener("touchstart", e => handleOnDown(e.touches[0]));

      window.addEventListener("mouseup", handleOnUp);
      window.addEventListener("touchend", e => handleOnUp(e.touches[0]));

      window.addEventListener("mousemove", handleOnMove);
      window.addEventListener("touchmove", e => handleOnMove(e.touches[0]));
    } else {

      window.removeEventListener("mousedown", handleOnDown);
      window.removeEventListener("touchstart", e => handleOnDown(e.touches[0]));

      window.removeEventListener("mouseup", handleOnUp);
      window.removeEventListener("touchend", e => handleOnUp(e.touches[0]));

      window.removeEventListener("mousemove", handleOnMove);
      window.removeEventListener("touchmove", e => handleOnMove(e.touches[0]));
    }
  });
}, {
  threshold: 0.3
});

observer.observe(target);

// Lightbox kod


const overlayTexts = document.querySelectorAll('.overlay-text');
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox.querySelector('img');

overlayTexts.forEach((overlay) => {
  overlay.addEventListener('click', (event) => {
    // sprečavanje da klik na overlay zatvori lightbox odmah
    event.stopPropagation();

    // Preuzimanje slike koja je vezana za tekst
    const img = overlay.previousElementSibling; // pretpostavljam da je img uvek pre overlay-a
    lightboxImg.src = img.src;
    lightbox.classList.add('active');
  });
});

lightbox.addEventListener('click', () => {
  lightbox.classList.remove('active');
  lightboxImg.src = '';
});



const galleryItems = document.querySelectorAll('#image-track img');


galleryItems.forEach((img) => {

  img.addEventListener('click', () => {
    lightboxImg.src = img.src; 
    lightbox.classList.add('active');
  });
});

lightbox.addEventListener('click', () => {
  lightbox.classList.remove('active');
  lightboxImg.src = ''; 
});

// Kraj lightbox koda

// Kreiranje cestica na poziciji misa krece ovde

const canvas = document.querySelector('.fluid-cursor');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let particles = [];
let animationFrameId = null;

function createParticle(x, y) {
  particles.push({
    x: x,
    y: y,
    size: Math.random() * 20 + 15,
    speedX: (Math.random() - 0.5) * 2,
    speedY: (Math.random() - 0.5) * 2,
    opacity: 0.7,
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle, index) => {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(33, 3, 38, ${particle.opacity})`;
    ctx.fill();

    particle.x += particle.speedX;
    particle.y += particle.speedY;
    particle.size *= 0.98;
    particle.opacity -= 0.01;

    if (particle.opacity <= 0 || particle.size <= 1) {
      particles.splice(index, 1);
    }
  });

  animationFrameId = requestAnimationFrame(animate);
}

// 💡 Funkcija za upravljanje česticama
function enableParticles() {
  document.addEventListener('mousemove', mouseMoveHandler);
  animate();
}

function disableParticles() {
  document.removeEventListener('mousemove', mouseMoveHandler);
  cancelAnimationFrame(animationFrameId);
  particles = []; // očisti sve čestice
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 🎯 Handler za miša (poseban da može da se ukloni)
function mouseMoveHandler(e) {
  createParticle(e.clientX, e.clientY);
}

// 🧠 Intersection Observer za section.one
const sectionOne = document.querySelector('.one');

const observerOne = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      enableParticles();
    } else {
      disableParticles();
    }
  });
}, {
  threshold: 0.3
});

observerOne.observe(sectionOne);


//onload animacija

const observer2 = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if(entry.isIntersecting){
      entry.target.classList.add("show");
    }else{
      entry.target.classList.remove("show");
    }
  });
});

const hiddenElements = document.querySelectorAll(".hidden");
hiddenElements.forEach((el) => observer2.observe(el));
