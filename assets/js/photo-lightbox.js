// Click a collage photo to view it full screen.
// Arrow keys / swipe to move between photos, Esc or click the backdrop to close.
(() => {
  const links = [...document.querySelectorAll(".collage-item")];
  if (!links.length) return;

  const box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.innerHTML = `
    <button class="lightbox-close" aria-label="Close">&times;</button>
    <button class="lightbox-prev" aria-label="Previous photo">&lsaquo;</button>
    <img alt="">
    <button class="lightbox-next" aria-label="Next photo">&rsaquo;</button>`;
  document.body.appendChild(box);

  const img = box.querySelector("img");
  let current = 0;

  const show = (i) => {
    current = (i + links.length) % links.length;
    img.src = links[current].href;
    img.alt = links[current].querySelector("img").alt;
    box.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    box.hidden = true;
    img.removeAttribute("src");
    document.body.style.overflow = "";
    links[current].focus();
  };

  links.forEach((link, i) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      show(i);
    })
  );

  box.querySelector(".lightbox-prev").addEventListener("click", () => show(current - 1));
  box.querySelector(".lightbox-next").addEventListener("click", () => show(current + 1));
  box.querySelector(".lightbox-close").addEventListener("click", close);
  box.addEventListener("click", (e) => {
    if (e.target === box) close();
  });

  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(current - 1);
    else if (e.key === "ArrowRight") show(current + 1);
  });

  // Swipe left / right on touch screens
  let touchX = null;
  box.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  box.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
})();
