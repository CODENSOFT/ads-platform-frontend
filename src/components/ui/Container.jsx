const Container = ({ children, className = '', style }) => {
  return (
    <div className={`p-container ${className}`} style={style}>
      {children}
    </div>
  );
};

export default Container;

