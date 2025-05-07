

console.log("RADI LI OVO")


// Prvo pronađi element koji želiš da posmatraš
const target = document.querySelector('.three');

// Napravi observer
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
        const track = document.getElementById("image-track");

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
          
          track.animate({
            transform: `translate(${nextPercentage}%, -50%)`
          }, { duration: 1200, fill: "forwards" });
          
          for(const image of track.getElementsByClassName("image")) {
            image.animate({
              objectPosition: `${100 + nextPercentage}% center`
            }, { duration: 1200, fill: "forwards" });
          }
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
  threshold: 0.5 // 50% elementa mora biti u viewportu
});

// Pokreni observer
observer.observe(target);