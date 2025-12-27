import './Layout.scss';

function Layout({ children }) {
  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__container">
          <h1 className="layout__title">CipherSQLStudio</h1>
        </div>
      </header>
      <main className="layout__main">
        <div className="layout__container">
          {children}
        </div>
      </main>
      <footer className="layout__footer">
        <div className="layout__container">
          <p className="layout__footer-text">© 2024 CipherSQLStudio</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;

