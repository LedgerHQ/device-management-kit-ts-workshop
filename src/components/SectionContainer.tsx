export const SectionContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      rowGap: 20,
      alignItems: "center",
    }}
  >
    {children}
  </div>
);
