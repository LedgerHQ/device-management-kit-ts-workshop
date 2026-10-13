export const LabelizedInput: React.FC<{
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, value, onChange, disabled }) => (
  <form>
    <label>
      {label}
      {": "}
    </label>
    <input disabled={disabled} value={value} onChange={onChange} />
  </form>
);
