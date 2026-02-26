import '../styles/ResourcePage.css';

const resources = [
  { name: 'Quotes', icon: '💰', desc: 'Create and manage vendor quotes' },
  { name: 'Work Orders', icon: '🔧', desc: 'Create and track work orders' },
  { name: 'Invoices', icon: '📄', desc: 'Generate and manage invoices' },
  { name: 'Reports', icon: '📈', desc: 'View analytics and reports' },
  { name: 'Users', icon: '👥', desc: 'Manage user accounts' },
  { name: 'Roles', icon: '🔐', desc: 'Configure roles and permissions' },
];

export default function ComingSoon({ resource }: { resource: string }) {
  const item = resources.find(r => r.name === resource);

  return (
    <div className="resource-page">
      <div className="page-header">
        <h1>{item?.icon} {item?.name}</h1>
      </div>

      <div className="placeholder-content">
        <p style={{ fontSize: '1.5em', marginBottom: '10px' }}>🚀 Coming Soon</p>
        <p>{item?.desc}</p>
      </div>
    </div>
  );
}
