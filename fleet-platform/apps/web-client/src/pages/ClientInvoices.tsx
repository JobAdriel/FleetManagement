import '../styles/ClientPage.css';

export default function ClientInvoices() {
  return (
    <div className="client-page">
      <h1>📄 Invoices</h1>
      <p>View your invoices and payment history</p>

      <div className="empty-state">
        <p>🚀 Coming Soon</p>
        <p>Download and manage your invoices</p>
      </div>
    </div>
  );
}
