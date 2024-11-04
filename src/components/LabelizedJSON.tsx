export const LabelizedJSON: React.FC<{ label: string; value: unknown }> = ({
  label,
  value,
}) => (
  <div
    style={{
      overflow: "scroll",
      textAlign: "start",
      background: "#eee",
      borderRadius: 4,
      padding: 10,
      marginTop: 10,
    }}
  >
    <b>{label}:</b>
    <pre>
      {value
        ? JSON.stringify(
            value,
            value instanceof Error ? Object.getOwnPropertyNames(value) : null,
            2
          )
        : "undefined"}
      {value instanceof Error ? "\n\n" + value.stack : ""}
    </pre>
  </div>
);
