export type DatePickerProps = {
  value         ?: string;
  onChangeAction : (isoDate: string) => void;
  label         ?: string;
  placeholder   ?: string;
  disabled      ?: boolean;
  required      ?: boolean;
  className     ?: string;
};
