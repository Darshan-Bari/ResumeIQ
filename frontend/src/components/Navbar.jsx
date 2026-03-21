import React from 'react';

const MENU_ITEMS = [
  { label: 'Home', href: '#home' },
  { label: 'Our Approach', href: '#our-approach' },
  { label: 'Our People', href: '#our-people' },
  { label: 'Contact Us', href: '#contact-us' },
];

function Navbar() {
  return (
    <header className="top-navbar" data-interactive-card="true">
      <div className="nav-logo" aria-label="ResumeIQ logo">R</div>
      <nav className="nav-menu" aria-label="Primary navigation">
        {MENU_ITEMS.map((item) => (
          <a key={item.label} href={item.href} className="nav-link">
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export default Navbar;
