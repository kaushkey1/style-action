/** Marks option codes that are only a colour, where several articles may share one row. */
export function ColourOnlyChip(): React.ReactNode {
  return (
    <span
      className="shrink-0 rounded-full border border-dashed border-gray-300 px-1.5 text-xs leading-4 text-gray-600"
      title="The source option code is only a colour, so several unrelated articles may be grouped in this row (open data ruling)"
    >
      Colour-only code
    </span>
  );
}
