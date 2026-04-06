interface EntryTagProps {
  label: string;
  variant?: "default" | "agent";
}

export default function EntryTag({ label, variant = "default" }: EntryTagProps) {
  return (
    <span className={`entry-tag${variant === "agent" ? " entry-tag--agent" : ""}`}>
      {label}
    </span>
  );
}
