const Button = ({ children, variant = 'primary', className = '', style, ...props }) => {
  const v = variant === 'primary'
    ? 'btn-primary'
    : variant === 'danger'
      ? 'btn-danger'
      : 'btn-secondary';

  return (
    <button className={`btn ${v} ${className}`.trim()} style={style} {...props}>
      {children}
    </button>
  );
};

export default Button;

