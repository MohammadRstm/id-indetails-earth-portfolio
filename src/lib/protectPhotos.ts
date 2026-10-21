/**
 * Makes the site's photos awkward to save: right-clicking one offers no "Save
 * image as" or "Copy image", and it can't be dragged out of the page. Phones'
 * long-press menu and printing are handled in the stylesheet. A deterrent only:
 * whatever a browser shows can still be captured (README, "Protecting the photos").
 */
export function protectPhotos(root: Pick<Document, 'addEventListener'> = document): void {
  const block = (event: Event) => {
    if (event.target instanceof HTMLImageElement) event.preventDefault();
  };
  root.addEventListener('contextmenu', block);
  root.addEventListener('dragstart', block);
}
