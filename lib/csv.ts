export const csvCell = (value: unknown) =>
  `"${String(value ?? '')
    .replaceAll('"', '""')
    .replace(/^[=+\-@]/, "'$&")}"`;
