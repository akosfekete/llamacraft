const nonAlphaNumeric = /[^a-zA-Z0-9 ]/g

export function removeEmojis(str: string | undefined): string {
  return str?.replace(nonAlphaNumeric, "").trim() ?? "";
}
