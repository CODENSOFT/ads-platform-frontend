import Container from './Container';

const PageHeader = ({ title, subtitle, right }) => {
  return (
    <Container>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="t-h2">{title}</div>
          {subtitle ? <div className="t-muted" style={{ marginTop: 8 }}>{subtitle}</div> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
    </Container>
  );
};

export default PageHeader;

