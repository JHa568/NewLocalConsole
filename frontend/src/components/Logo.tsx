export default function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`group grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-warm to-accent text-ink ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="60%"
        height="60%"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-500 ease-in-out group-hover:rotate-180"
      >
        <path d="M6 3h12M6 21h12M7 3v2.3a3 3 0 0 0 1.2 2.4L12 11l3.8-3.3A3 3 0 0 0 17 5.3V3M7 21v-2.3a3 3 0 0 1 1.2-2.4L12 13l3.8 3.3a3 3 0 0 1 1.2 2.4V21" />
      </svg>
    </span>
  );
}
