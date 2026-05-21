const grid = document.querySelector(".grid");

const masonry = new Masonry(grid, {
    itemSelector: ".grid-item",
    columnWidth: ".grid-sizer",
    gutter: ".gutter-sizer",
    percentPosition: true,
    transitionDuration: "240ms"
});

imagesLoaded(grid).on("progress", () => {
    masonry.layout();
});

function updateZoom(item, button) {
    const activeItem = grid.querySelector(".grid-item.is-zoomed");

    if (activeItem && activeItem !== item) {
        activeItem.classList.remove("is-zoomed");
        activeItem.querySelector(".image-button").setAttribute("aria-pressed", "false");
    }

    const willZoom = !item.classList.contains("is-zoomed");
    item.classList.toggle("is-zoomed", willZoom);
    button.setAttribute("aria-pressed", String(willZoom));

    requestAnimationFrame(() => masonry.layout());
    window.setTimeout(() => masonry.layout(), 260);
}

grid.addEventListener("click", (event) => {
    const button = event.target.closest(".image-button");

    if (!button) {
        return;
    }

    updateZoom(button.closest(".grid-item"), button);
});