export function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toSnakeCase<T>(input: T): any {
  if (input instanceof Object && (input as any).constructor?.name === "UUID") {
    return (input as any).toString();
  }

  if (input instanceof Date) {
    return input.toISOString();
  }

  if (Array.isArray(input)) {
    return input.map(toSnakeCase);
  }

  if (input !== null && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input as Record<string, any>).map(([key, value]) => [
        camelToSnake(key),
        toSnakeCase(value),
      ])
    );
  }

  return input;
}

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function keysToCamel<T>(value: any): T {
  if (Array.isArray(value)) {
    return value.map((v) => keysToCamel(v)) as any;
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, any>).map(([key, val]) => [
        snakeToCamel(key),
        keysToCamel(val),
      ])
    ) as any;
  }

  return value;
}

