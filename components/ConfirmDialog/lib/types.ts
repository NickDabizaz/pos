export type ConfirmDialogProps = {
  alasan         ?: boolean;
  cancelLabel    ?: string;
  confirmLabel   ?: string;
  description     : string;
  isConfirming   ?: boolean;
  onCancelAction   : () => void;
  onConfirmAction  : (alasan?: string) => void;
  title            : string;
  tone           ?: "danger" | "neutral";
};
