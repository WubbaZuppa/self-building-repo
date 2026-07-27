document.addEventListener('DOMContentLoaded', () => {
  // Typing Effect
  const titles = [
    'Full Stack Developer',
    'AI System Architect',
    'UI/UX Enthusiast',
    'Creative Technologist'
  ];
  
  let titleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typingElement = document.getElementById('typing-text');
  const typeSpeed = 100;
  const deleteSpeed = 50;
  const pauseTime = 2000;

  function typeEffect() {
    if (!typingElement) return;
    
    const currentTitle = titles[titleIndex];
    
    if (isDeleting) {
      typingElement.textContent = currentTitle.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingElement.textContent = currentTitle.substring(0, charIndex + 1);
      charIndex++;
    }

    if (!isDeleting && charIndex === currentTitle.length) {
      isDeleting = true;
      setTimeout(typeEffect, pauseTime);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      titleIndex = (titleIndex + 1) % titles.length;
      setTimeout(typeEffect, 500);
    } else {
      setTimeout(typeEffect, isDeleting ? deleteSpeed : typeSpeed);
    }
  }

  typeEffect();

  // Project Filtering
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'block';
          card.style.animation = 'fadeIn 0.5s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Contact Form Simulation
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      formStatus.textContent = '⚡ Sending message...';
      formStatus.style.color = '#38bdf8';

      setTimeout(() => {
        formStatus.textContent = '🎉 Message sent successfully! Thanks for reaching out.';
        formStatus.style.color = '#4ade80';
        contactForm.reset();
      }, 1500);
    });
  }
});
