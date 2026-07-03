import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type SelectFieldOption = {
  value: string
  label: string
}

type SelectFieldProps = {
  id: string
  label: string
  placeholder: string
  value: string | undefined
  onValueChange: (value: string) => void
  options: SelectFieldOption[]
  error?: string
}

export function SelectField({
  id,
  label,
  placeholder,
  value,
  onValueChange,
  options,
  error,
}: SelectFieldProps) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} aria-label={label} aria-invalid={!!error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
