const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {threshold:0.12});
  revealEls.forEach(el=>io.observe(el));
} else {
  revealEls.forEach(el=>el.classList.add('in'));
}

// Carousels (used on the Off The Clock page)
document.querySelectorAll('.carousel').forEach(carousel => {
  const slides = carousel.querySelectorAll('.carousel-slide');
  const counter = carousel.querySelector('.carousel-counter');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');
  let index = 0;

  function render(){
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
  }

  prevBtn?.addEventListener('click', () => {
    index = (index - 1 + slides.length) % slides.length;
    render();
  });
  nextBtn?.addEventListener('click', () => {
    index = (index + 1) % slides.length;
    render();
  });

  render();
});