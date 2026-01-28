const Card = ({ children, className = '', style, hover = false }) => {
  return (
    <div className={`p-card ${hover ? 'p-card-hover' : ''} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
};

export default Card;

