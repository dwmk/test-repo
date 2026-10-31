const LINKS = [
  { token: 'makron.js', href: 'https://www.npmjs.com/package/makronjs' },
  { token: 'Hana 3D', href: 'https://hana.makron.app/docs/api/third-party-avatar' },
];

const PATTERN = new RegExp(`(${LINKS.map((link) => link.token.replace(/[.]/g, '\\.')).join('|')})`, 'g');

export default function LinkedText({ text }) {
  return (
    <>
      {String(text).split(PATTERN).map((part, index) => {
        const link = LINKS.find((entry) => entry.token === part);
        if (!link) return <span key={index}>{part}</span>;
        return (
          <a
            key={index}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
          >
            {part}
          </a>
        );
      })}
    </>
  );
}