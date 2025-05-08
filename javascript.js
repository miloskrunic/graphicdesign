// Prvo pronađi element koji želiš da posmatraš
const target = document.querySelector('.three');

// Napravi observer
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    console.log("Vidim treci element")
    if (entry.isIntersecting) {
        const track = document.getElementById("image-track");
        const thumb = document.querySelector(".thumb"); // Pronađi thumb

        const handleOnDown = e => track.dataset.mouseDownAt = e.clientX;
        
        const handleOnUp = () => {
          track.dataset.mouseDownAt = "0";  
          track.dataset.prevPercentage = track.dataset.percentage;
        }
        
        const handleOnMove = e => {
          if(track.dataset.mouseDownAt === "0") return;
          
          const mouseDelta = parseFloat(track.dataset.mouseDownAt) - e.clientX,
                maxDelta = window.innerWidth / 2;
          
          const percentage = (mouseDelta / maxDelta) * -100,
                nextPercentageUnconstrained = parseFloat(track.dataset.prevPercentage) + percentage,
                nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 0), -100);
          
          track.dataset.percentage = nextPercentage;
          
          // Pomeri track
          track.animate({
            transform: `translate(${nextPercentage}%, -50%)`
          }, { duration: 1200, fill: "forwards" });
          
          // Pomeri slike unutar track-a
          for(const image of track.getElementsByClassName("image")) {
            image.animate({
              objectPosition: `${100 + nextPercentage}% center`
            }, { duration: 1200, fill: "forwards" });
          }

          // Pomeri thumb (tacku) u skladu sa pomeranjem galerije
          const trackWidth = document.querySelector(".track").offsetWidth;
          const thumbPos = (nextPercentage / -100) * trackWidth;  // Izračunaj poziciju thumb-a
          thumb.style.left = `${thumbPos}px`;  // Pomeri thumb
        }

        /* -- Had to add extra lines for touch events -- */
        
        window.onmousedown = e => handleOnDown(e);
        
        window.ontouchstart = e => handleOnDown(e.touches[0]);
        
        window.onmouseup = e => handleOnUp(e);
        
        window.ontouchend = e => handleOnUp(e.touches[0]);
        
        window.onmousemove = e => handleOnMove(e);
        
        window.ontouchmove = e => handleOnMove(e.touches[0]);
        
      console.log('Element je ušao u viewport!');

      // Ako želiš da se kod izvrši samo jednom, onda:
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.9 // 50% elementa mora biti u viewportu
});


// Pokreni observer
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
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Postavi dimenzije canvasa
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Postavljene dimenzije canvasa

let particles = [];

// Funkcija koja kreira čestice na poziciji miša
function createParticle(x, y) {
    
  particles.push({
    x: x,
    y: y,
    size: Math.random() * 20 + 15,  // Random veličina čestica
    speedX: (Math.random() - 0.5) * 2,  // Random kretanje po X
    speedY: (Math.random() - 0.5) * 2,  // Random kretanje po Y
    opacity: 0.7,  // Početna opacnost čestice
  });
}

// Animacija koja crta čestice i pravi razlivanje boje
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);  // Čisti canvas na svakom frame-u

  particles.forEach((particle, index) => {
    // Crtanje čestice u obliku kruga
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(33, 3, 38, ${particle.opacity})`;  // Ružičasta boja sa promenljivom opacnošću
    ctx.fill();

    // Kretanje čestice
    particle.x += particle.speedX;
    particle.y += particle.speedY;
    particle.size *= 0.98;  // Čestica se smanjuje
    particle.opacity -= 0.01;  // Smanjujemo opacnost

    // Ako čestica nestane (mali radius ili opacnost), brišemo je
    if (particle.opacity <= 0 || particle.size <= 1) {
      particles.splice(index, 1);
    }
  });

  requestAnimationFrame(animate);  // Traži sledeći frame
}

// Pratimo kretanje miša i dodajemo čestice na poziciji kursora
document.addEventListener('mousemove', (e) => {


console.log("RADI LI OVO")

  createParticle(e.clientX, e.clientY);  // Kreiramo česticu na poziciji miša
});

// Početak animacije
animate();

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
