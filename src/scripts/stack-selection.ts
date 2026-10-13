/** Visual emphasis only: categories and skill claims never change. */
export function initializeStackSelection() {
  const groups = document.querySelector<HTMLElement>('.stack-groups');
  if (!groups || groups.dataset.stackSelection) return;
  groups.dataset.stackSelection = 'ready';
  const cards = [...groups.querySelectorAll<HTMLElement>('[data-stack-group]')];

  cards.forEach((card) => {
    card.querySelector<HTMLButtonElement>('[data-stack-select]')!.hidden =
      false;
    card.querySelector<HTMLElement>('[data-stack-title]')!.hidden = true;
  });
  groups.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const selected = event.target.closest<HTMLElement>('[data-stack-group]');
    if (!selected || !cards.includes(selected)) return;
    cards.forEach((card) => {
      const active = card === selected;
      if (active) card.dataset.selected = 'true';
      else delete card.dataset.selected;
      card
        .querySelector('[data-stack-select]')!
        .setAttribute('aria-pressed', String(active));
    });
  });
}
