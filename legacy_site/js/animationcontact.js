// gsap animations
var animation = gsap.timeline();
animation
    // .from('.lineasdenegocio', { opacity: 0, duration: 1, ease: "back.out(1.7)", x: -100 }, "+=0.4")
    .fromTo('.btn-whatsap', {scale: 1}, {duration: 0.4, scale: 1.4})
    .fromTo('.btn-whatsap', {scale: 1.4}, {duration: 1.6, scale: 1}).repeat(40);
    
    