import Card from './Card';

const EmptyState = ({ title, description, action }) => {
  return (
    <Card style={{ padding: 28, textAlign: 'center' }}>
      <div className="t-h3" style={{ marginBottom: 8 }}>{title}</div>
      {description ? <div className="t-muted" style={{ marginBottom: 16 }}>{description}</div> : null}
      {action ? <div>{action}</div> : null}
    </Card>
  );
};

export default EmptyState;

