const Input = ({ className = '', style, ...props }) => {
  return <input className={`p-input ${className}`.trim()} style={style} {...props} />;
};

export default Input;

