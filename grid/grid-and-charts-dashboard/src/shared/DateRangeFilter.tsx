/** An inclusive range of days, as YYYY-MM-DD strings. */
export interface DateRange {
    start: string;
    end: string;
}

interface DateRangeFilterProps {
    value: DateRange;
    /** The earliest and latest days that can be picked. */
    min: string;
    max: string;
    onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, min, max, onChange }: DateRangeFilterProps) {
    return (
        <fieldset className="date-range">
            <legend className="visually-hidden">Order date range</legend>
            <label>
                <span>Start date</span>
                <input
                    type="date"
                    value={value.start}
                    // The two inputs limit each other, so the picker never offers a start after the end.
                    min={min}
                    max={value.end}
                    required
                    // Ignore a cleared input, so the range always has both dates.
                    onChange={(e) => e.target.value && onChange({ ...value, start: e.target.value })}
                />
            </label>
            <label>
                <span>End date</span>
                <input
                    type="date"
                    value={value.end}
                    min={value.start}
                    max={max}
                    required
                    onChange={(e) => e.target.value && onChange({ ...value, end: e.target.value })}
                />
            </label>
        </fieldset>
    );
}
