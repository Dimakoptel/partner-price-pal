import * as React from "react";
import { cn } from "@/lib/utils";

type NumericInputProps = Omit<React.ComponentProps<"input">, "type" | "onChange" | "value"> & {
  value: number;
  onValueChange: (value: number) => void;
};

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, value, onValueChange, min, max, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(String(value));

    React.useEffect(() => {
      setDisplayValue(String(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Allow empty input
      if (raw === "" || raw === "-") {
        setDisplayValue(raw);
        return;
      }

      // Strip leading zeros but keep "0" and "0." patterns
      const cleaned = raw.replace(/^0+(?=\d)/, "");
      setDisplayValue(cleaned);

      const num = Number(cleaned);
      if (!isNaN(num)) {
        onValueChange(num);
      }
    };

    const handleBlur = () => {
      const num = Number(displayValue);
      if (isNaN(num) || displayValue === "" || displayValue === "-") {
        const fallback = typeof min === "number" ? min : 0;
        setDisplayValue(String(fallback));
        onValueChange(fallback);
      } else {
        setDisplayValue(String(num));
        onValueChange(num);
      }
    };

    return (
      <input
        type="number"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        {...props}
      />
    );
  },
);
NumericInput.displayName = "NumericInput";

export { NumericInput };
