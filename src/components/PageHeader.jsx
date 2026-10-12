import "./PageHeader.css";

// The title block at the top of every page except the home page.
export default function PageHeader({ title, children }) {
  return (
    <header className="page-header">
      <div className="container">
        <h1>{title}</h1>
        {children && <div className="page-header__intro">{children}</div>}
      </div>
    </header>
  );
}
