import { useApp } from '../state/AppContext';

export function NameToggle() {
  const { nameLang, setNameLang } = useApp();
  return (
    <div className="name-toggle" role="group" aria-label="Unit names language">
      <button
        type="button"
        className={nameLang === 'de' ? 'active' : ''}
        onClick={() => setNameLang('de')}
      >
        DE
      </button>
      <button
        type="button"
        className={nameLang === 'en' ? 'active' : ''}
        onClick={() => setNameLang('en')}
      >
        EN
      </button>
    </div>
  );
}
