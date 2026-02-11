type CleanOptions = {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeEmptyString?: boolean;
  removeEmptyArray?: boolean;
  removeEmptyObject?: boolean;
};

export function cleanObject<T>(
  value: T,
  options: CleanOptions = {}
): T {
  const {
    removeNull = true,
    removeUndefined = true,
    removeEmptyString = true,
    removeEmptyArray = true,
    removeEmptyObject = false,
  } = options;

  if (Array.isArray(value)) {
    const cleanedArray = value
      .map(v => cleanObject(v, options))
      .filter(v => {
        if (removeUndefined && v === undefined) return false;
        if (removeNull && v === null) return false;
        return true;
      });

    return (removeEmptyArray && cleanedArray.length === 0
      ? undefined
      : cleanedArray) as T;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    const cleanedEntries = Object.entries(value)
      .map(([key, val]) => [key, cleanObject(val, options)])
      .filter(([_, val]) => {
        if (removeUndefined && val === undefined) return false;
        if (removeNull && val === null) return false;
        if (removeEmptyString && val === '') return false;
        if (removeEmptyArray && Array.isArray(val) && val.length === 0) return false;
        if (
          removeEmptyObject &&
          typeof val === 'object' &&
          val !== null &&
          !Array.isArray(val) &&
          Object.keys(val).length === 0
        ) {
          return false;
        }
        return true;
      });

    return Object.fromEntries(cleanedEntries) as T;
  }

  if (removeEmptyString && value === '') {
    return undefined as T;
  }

  if (removeNull && value === null) {
    return undefined as T;
  }

  if (removeUndefined && value === undefined) {
    return undefined as T;
  }

  return value;
}
