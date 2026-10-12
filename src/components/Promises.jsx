import { Link } from "react-router";

import { promises } from "../content/site.js";
import "./Promises.css";

// `preview` adds a link through to the About page, for use on the home page.
export default function Promises({ preview = false }) {
  return (
    <section className="section promises" aria-labelledby="promises-title">
      <div className="container">
        <div className="section-heading">
          <h2 id="promises-title">What you can hold us to</h2>
          <p>
            Fake and badly stored medicines are a real problem in Nigeria. These are the standards
            we've set ourselves so you never have to wonder about what you're taking.
          </p>
        </div>

        <ul className="promises__grid">
          {promises.map((promise) => (
            <li key={promise.title} className="promise">
              <h3>{promise.title}</h3>
              <p>{promise.body}</p>
            </li>
          ))}
        </ul>

        {preview && (
          <Link to="/about" className="btn promises__more section-more">
            More about us
          </Link>
        )}
      </div>
    </section>
  );
}
