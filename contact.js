/* const canvas = document.querySelector('.fluid-cursor');
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







html
    <canvas class="fluid-cursor"></canvas>




css
.fluid-cursor {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1; /* Da canvas bude ispod sadržaja
}

*/