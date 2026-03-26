const btn = document.getElementById('enter-btn');
btn.addEventListener('mouseenter', () => {
    document.body.classList.add('hover');
});

btn.addEventListener('mouseleave', () => {
    document.body.classList.remove('hover');
});