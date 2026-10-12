import PageHeader from "../components/PageHeader.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import "./LegalLayout.css";

// Shared shell for the privacy and terms pages.
// `sections` is a list of { title, body } where body is JSX.
export default function LegalLayout({ title, description, updated, intro, sections }) {
  usePageTitle(`${title} | GPT Pharm & Meds`, description);

  return (
    <>
      <PageHeader title={title}>
        <p>{intro}</p>
        <p className="legal__updated">Last updated {updated}</p>
      </PageHeader>

      <div className="container">
        <article className="legal">
          <nav className="legal__contents" aria-label="On this page">
            <ol>
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#section-${index + 1}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          {sections.map((section, index) => (
            <section key={section.title} id={`section-${index + 1}`} className="legal__section">
              <h2>
                {index + 1}. {section.title}
              </h2>
              {section.body}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
