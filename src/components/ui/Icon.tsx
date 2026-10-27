import type { SVGProps } from "react";

// Hand-drawn 24px stroke icons, so the site needs no icon dependency.
const paths = {
  inbox: <><path d="M3 13h4.5l1.5 3h6l1.5-3H21" /><path d="M5.5 5h13L21 13v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" /></>,
  workflow: <><rect x="3" y="3" width="7" height="6" rx="1.5" /><rect x="14" y="15" width="7" height="6" rx="1.5" /><path d="M6.5 9v3.5a2 2 0 0 0 2 2H14" /><path d="m12 12.5 2 2-2 2" /></>,
  agent: <><rect x="4" y="7" width="16" height="12" rx="3" /><path d="M12 7V4" /><circle cx="12" cy="3" r="1" /><path d="M9 12v1.5M15 12v1.5" /><path d="M9.5 16h5" /><path d="M2 12v3M22 12v3" /></>,
  plug: <><path d="M9 3v4M15 3v4" /><path d="M6 7h12v3a6 6 0 0 1-12 0z" /><path d="M12 16v5" /></>,
  wrench: <path d="M14.7 6.3a4 4 0 0 0 5.3 5.3l-8.6 8.6a2.1 2.1 0 0 1-3-3zM14.7 6.3 17 4l3 3-2.3 2.3" />,
  fan: <><circle cx="12" cy="12" r="1.6" /><path d="M12 10.4C11 7 12 3.5 14.5 4s2 4.5-2.5 6.4" /><path d="M13.6 12c3.4-1 6.9 0 6.4 2.5s-4.5 2-6.4-2.5" /><path d="M12 13.6c1 3.4 0 6.9-2.5 6.4s-2-4.5 2.5-6.4" /><path d="M10.4 12C7 13 3.5 12 4 9.5s4.5-2 6.4 2.5" /></>,
  droplet: <><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z" /><path d="M9 14.5a3 3 0 0 0 3 3" /></>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  blueprint: <><path d="M4 20V6l5-2 6 2 5-2v14l-5 2-6-2z" /><path d="M9 4v14M15 6v14" /></>,
  code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4" /><path d="m13.5 5-3 14" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" /><path d="M20 20v-4h-4" /></>,
  keyboard: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  unlink: <><path d="M9 7H7a5 5 0 0 0 0 10h2" /><path d="M15 7h2a5 5 0 0 1 0 10h-2" /><path d="M3 3l3 3M21 21l-3-3" /></>,
  puzzle: <path d="M10 4a2 2 0 1 1 4 0v1h4a1 1 0 0 1 1 1v4h-1a2 2 0 1 0 0 4h1v4a1 1 0 0 1-1 1h-4v-1a2 2 0 1 0-4 0v1H6a1 1 0 0 1-1-1v-4h1a2 2 0 1 0 0-4H5V6a1 1 0 0 1 1-1h4z" />,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2 2 4-4" /></>,
  eye: <><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" /><circle cx="12" cy="12" r="2.8" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  arrowRight: <path d="M5 12h14m-5-5 5 5-5 5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  database: <><ellipse cx="12" cy="5.5" rx="7" ry="2.5" /><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13" /><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  sparkle: <path d="M12 3c.5 4.5 2 6.5 6.5 7.5-4.5 1-6 3-6.5 7.5-.5-4.5-2-6.5-6.5-7.5C10 9.5 11.5 7.5 12 3zM19 16c.2 1.6.8 2.3 2.3 2.5-1.5.3-2.1.9-2.3 2.5-.2-1.6-.8-2.2-2.3-2.5 1.5-.2 2.1-.9 2.3-2.5z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>,
  play: <path d="M7 5v14l11-7z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  pencil: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
} as const;

export type IconName = keyof typeof paths;

type IconProps = SVGProps<SVGSVGElement> & { name: IconName; title?: string };

export function Icon({ name, title, className = "size-5", ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
