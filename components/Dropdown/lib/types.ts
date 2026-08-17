export type DropdownOption<T extends string = string> = {
  value: T;
  label: string;
};

export type DropdownProps<T extends string = string> = {
  options       : DropdownOption<T>[];
  value        ?: T;
  onChangeAction: (value: T) => void;
  placeholder  ?: string;
  label        ?: string;
  disabled     ?: boolean;
  required     ?: boolean;
  className    ?: string;
};
