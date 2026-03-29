export const cn = (...parts) =>
  parts
    .flatMap((part) => {
      if (Array.isArray(part)) {
        return part;
      }

      if (typeof part === 'object' && part !== null) {
        return Object.entries(part)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key);
      }

      return part;
    })
    .filter(Boolean)
    .join(' ');
