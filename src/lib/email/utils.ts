export function interpolateTemplate(
  template: string,
  data: Record<string, string | number | undefined>
): string {
  return template.replace(/\${(.*?)}/g, (_, key) => {
    const value = data[key.trim()];
    return value !== undefined ? String(value) : "";
  });
}

// Keep a consistent display format used across UI
export function formatDateHuman(dmy: string) {
  // expects dd-mm-yyyy
  const [day, month, year] = dmy.split("-");
  const dayInt = Number(day);
  const suffix = ["th", "st", "nd", "rd"][
    dayInt % 10 > 3 || [11, 12, 13].includes(dayInt % 100) ? 0 : dayInt % 10
  ];
  const monthName = new Date(`${year}-${month}-${day}`).toLocaleString("en-GB", { month: "short" });
  return `${day}${suffix} ${monthName}`;
}

export function formatTimeHuman(hhmm: string) {
  return new Date(`1970-01-01T${hhmm}`).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Very small sanitization for contentEditable extraction used before sending
export function sanitizeEditableHtml(html: string) {
  return html
    .replace(/contenteditable="[^"]*"/gi, "")
    .replace(/suppresscontenteditablewarning="[^"]*"/gi, "")
    .replace(/\sstyle=""/gi, "")
    .trim();
}
