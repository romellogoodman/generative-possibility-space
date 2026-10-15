import { useState, useEffect } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import "./AboutPage.scss";

const REPO_URL =
  "https://github.com/romellogoodman/generative-possibility-space";

const INSTALL_PROMPT = `Install the GPS skill from ${REPO_URL.replace("https://", "")} (skills/gps) and use it to add its views to this project`;

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
          <h2 className="about__heading">What the squares are</h2>
          <p className="about__text">
            Every output here comes from a tiny example generator. Each square
            has a seed, and its size and shade are drawn from that seed, so the
            same square always comes back the same. The two numbers stand in for
            whatever settings a real generator has. Swap in yours and the views
            stay the same.
          </p>
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
          Special thanks to Luis Queral, who pointed GPS at his own video
          project and sketched Parameter map, Lineage, Breed and Blend.
        </p>
      </article>
    </div>
  );
}

/* ---------- Top bar ---------- */
