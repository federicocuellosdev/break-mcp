export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/[-￿]/g, (c) => `&#${c.charCodeAt(0)};`);

export const FONT_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap">';

export const FAVICON =
  '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%230087F2%22/%3E%3Cstop offset=%22.5%22 stop-color=%22%23BF4FCD%22/%3E%3Cstop offset=%221%22 stop-color=%22%23E13B7D%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%2232%22 height=%2232%22 fill=%22%231B1B1D%22/%3E%3Ccircle cx=%2216%22 cy=%2216%22 r=%228%22 fill=%22url(%23g)%22/%3E%3C/svg%3E">';

export const BREAK_LOGO = '<span class="logo">break<span class="dot"></span></span>';
