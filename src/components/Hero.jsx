import content from "../data/content";

export default function Hero() {
  return (
    <header className="hero">
      <div className="balloons" aria-hidden="true">
        <span>🎈</span><span>🎈</span><span>🎈</span>
      </div>
      <h1 className="hero-title">
        Happy Birthday,<br />
        <span className="hero-name">{content.name}!</span> 🎉
      </h1>
      <p className="hero-sub">There's a little surprise waiting for you below.</p>
    </header>
  );
}
