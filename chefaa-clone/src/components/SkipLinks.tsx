import React from 'react';

interface SkipLink {
  id: string;
  label: string;
}

const defaultSkipLinks: SkipLink[] = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'navigation', label: 'Skip to navigation' },
  { id: 'footer', label: 'Skip to footer' },
  { id: 'search', label: 'Skip to search' },
];

interface SkipLinksProps {
  links?: SkipLink[];
}

const SkipLinks: React.FC<SkipLinksProps> = ({ links = defaultSkipLinks }) => {
  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="skip-links">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          onClick={(e) => {
            e.preventDefault();
            handleClick(link.id);
          }}
          className="skip-link"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

export default SkipLinks;
