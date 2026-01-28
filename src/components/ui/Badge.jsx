const Badge = ({ children, className = '', style }) => {
  return (
    <span className={`p-badge ${className}`.trim()} style={style}>
      {children}
    </span>
  );
};

export default Badge;

