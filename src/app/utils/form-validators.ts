import { pattern, PathKind, required, SchemaPath, SchemaPathRules } from "@angular/forms/signals";

/** The text field must contain at least one non-whitespace character. */
export function requiredText<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>
): void {
  required(path);
  pattern(path, /\S/);
}
