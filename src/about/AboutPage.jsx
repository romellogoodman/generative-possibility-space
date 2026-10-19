import { useState, useEffect } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import "./AboutPage.scss";

const REPO_URL =
  "https://github.com/romellogoodman/generative-possibility-space";

// Credit for the Art Blocks examples: the art, where it lives, and the metadata licence
const PROJECTS_URL =
  "https://www.artblocks.io/collections/curated/projects/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";
const LICENSE_URL = "https://creativecommons.org/licenses/by-nc/4.0/";

const FIDENZA = {
  site: "https://www.tylerxhobbs.com/words/fidenza",
  artist: "https://tylerxhobbs.com",
  project: `${PROJECTS_URL}/78`,
  license: LICENSE_URL,
};

const MERIDIAN = {
  site: "https://meridian.mattdesl.com/",
  artist: "https://www.mattdesl.com",
  project: `${PROJECTS_URL}/163`,
  license: LICENSE_URL,
};

const ASEMICA = {
  site: "https://asemi.ca/",
  project: `${PROJECTS_URL}/206`,
};

const INSTALL_PROMPT = `Install the GPS skill from ${REPO_URL.replace("https://", "")} (skills/gps) and use it to add its views to this project`;

// The project's own site, beside its name on About
function SiteLink({ href }) {
  return (
    <a className="about__site" href={href} target="_blank" rel="noreferrer">
      {new URL(href).hostname.replace(/^www\./, "")}
      <ArrowUpRight />
    </a>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <button
      className="about__copy"
      onClick={() =>
        navigator.clipboard?.writeText(text).then(() => setCopied(true))
      }
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// What GPS is, and the prompt that adds its views to someone's own project
export function AboutPage() {
  return (
    <div className="about">
      <article className="about__body">
        <h1 className="about__title">Generative possibility space</h1>
        <p className="about__lede">Ways to browse generative outputs</p>
        <a
          className="about__link"
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
        >
          Github
        </a>
        <section className="about__section">
          <h2 className="about__heading">Examples</h2>
          <p className="about__text">
            Each example brings its own settings, and the views turn them into
            axes, dials and groups.
          </p>
          <ol className="about__examples">
            <li className="about__example">
              <h3 className="about__example-name">Grey squares</h3>
              <p className="about__text">
                Two number settings, drawn from each square's seed. Size runs
                across, shade runs down.
              </p>
            </li>
            <li className="about__example">
              <h3 className="about__example-name">
                Asemica <SiteLink href={ASEMICA.site} />
              </h3>
              <p className="about__text">
                980 real outputs in an invented script. Grid runs across, margin
                runs down, and each output keeps its composition through Breed
                and Blend.
              </p>
              <p className="about__credit">
                Asemica by Emily Edelman, Dima Ofman and Andrew Badr, via{" "}
                <a href={ASEMICA.project} target="_blank" rel="noreferrer">
                  Art Blocks
                </a>
                . © the artists, shown as a non-commercial demo while we ask
                their permission.
              </p>
            </li>
            <li className="about__example">
              <h3 className="about__example-name">
                Fidenza <SiteLink href={FIDENZA.site} />
              </h3>
              <p className="about__text">
                999 real outputs with 11 traits each. Density runs across,
                turbulence runs down, scale is a dial and colors are families.
              </p>
              <p className="about__credit">
                Fidenza by{" "}
                <a href={FIDENZA.artist} target="_blank" rel="noreferrer">
                  Tyler Hobbs
                </a>
                , via{" "}
                <a href={FIDENZA.project} target="_blank" rel="noreferrer">
                  Art Blocks
                </a>
                .{" "}
                <a href={FIDENZA.license} target="_blank" rel="noreferrer">
                  CC BY-NC 4.0
                </a>
                , non-commercial demo.
              </p>
            </li>
            <li className="about__example">
              <h3 className="about__example-name">
                Meridian <SiteLink href={MERIDIAN.site} />
              </h3>
              <p className="about__text">
                1,000 real outputs with 6 traits each, drawn tall. Zoom runs
                across, chromaticity runs down, frequency is a dial and style
                and palette are families.
              </p>
              <p className="about__credit">
                Meridian by{" "}
                <a href={MERIDIAN.artist} target="_blank" rel="noreferrer">
                  Matt DesLauriers
                </a>
                , via{" "}
                <a href={MERIDIAN.project} target="_blank" rel="noreferrer">
                  Art Blocks
                </a>
                .{" "}
                <a href={MERIDIAN.license} target="_blank" rel="noreferrer">
                  CC BY-NC 4.0
                </a>
                , non-commercial demo.
              </p>
            </li>
          </ol>
        </section>
        <section className="about__section">
          <h2 className="about__heading">Use it on your own outputs</h2>
          <p className="about__text">
            Paste this into Claude Code in the project that makes your outputs.
            It installs the GPS skill, asks which settings matter, and adds
            these views using your real outputs.
          </p>
          <div className="about__prompt">
            <code>{INSTALL_PROMPT}</code>
            <CopyButton text={INSTALL_PROMPT} />
          </div>
          <a
            className="about__link"
            href={`${REPO_URL}/blob/main/skills/gps/patterns.md`}
            target="_blank"
            rel="noreferrer"
          >
            Every view and what it needs <ArrowUpRight />
          </a>
        </section>
        <p className="about__thanks">
          Special thanks to Luis Queral for feedback and the initial sketches
          for Parameter map, Lineage, Breed and Blend.
        </p>
      </article>
    </div>
  );
}

/* ---------- Top bar ---------- */
