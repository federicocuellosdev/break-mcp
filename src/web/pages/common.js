export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/[-￿]/g, (c) => `&#${c.charCodeAt(0)};`);

export const FONT_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap">';

export const FAVICON = '<link rel="icon" type="image/svg+xml" href="/public/favicon.svg">';

export const BREAK_LOGO = '<span class="logo">break<span class="dot"></span></span>';
