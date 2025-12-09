'use client';

interface MultipleChoiceQuestionProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: { value: string; label: string }[];
  allowMultiple?: boolean;
  error?: string;
}

export default function MultipleChoiceQuestion({
  value,
  onChange,
  options,
  allowMultiple = false,
  error,
}: MultipleChoiceQuestionProps) {
  const isSelected = (optionValue: string): boolean => {
    if (Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  const handleSingleSelect = (optionValue: string) => {
    onChange(optionValue);
  };

  const handleMultiSelect = (optionValue: string) => {
    const currentValues = Array.isArray(value) ? value : [];
    if (currentValues.includes(optionValue)) {
      onChange(currentValues.filter((v) => v !== optionValue));
    } else {
      onChange([...currentValues, optionValue]);
    }
  };

  const handleChange = (optionValue: string) => {
    if (allowMultiple) {
      handleMultiSelect(optionValue);
    } else {
      handleSingleSelect(optionValue);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-3" role={allowMultiple ? 'group' : 'radiogroup'}>
        {options.map((option) => {
          const selected = isSelected(option.value);
          return (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                selected
                  ? 'border-red-primary bg-red-primary/5'
                  : 'border-border bg-surface hover:bg-surface-highlight'
              }`}
            >
              <input
                type={allowMultiple ? 'checkbox' : 'radio'}
                name={allowMultiple ? undefined : 'choice'}
                value={option.value}
                checked={selected}
                onChange={() => handleChange(option.value)}
                className="w-5 h-5 text-red-primary border-border focus:ring-red-primary focus:ring-2"
                aria-invalid={error ? 'true' : 'false'}
              />
              <span
                className={`text-base ${
                  selected ? 'text-red-primary font-medium' : 'text-foreground'
                }`}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <span className="text-red-500 text-sm mt-2 block" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
