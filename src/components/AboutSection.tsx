export function AboutSection() {
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <div className="about__inner">
        <h2 className="about__title" id="about-title">
          ID-Indetails is an architecture studio designing homes, hotels and residences around the world.
        </h2>
        <div className="about__body">
          <p>
            We work from the first sketch to the last detail: architecture, interiors and landscape, shaped by each site’s climate,
            light and craft.
          </p>
          <p>
            The projects on the globe are illustrative examples prepared for this preview. Their names, clients and details are
            invented, and the photographs are free-licence images credited on each project page.
          </p>
        </div>
      </div>
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} ID-Indetails</p>
        <p>Country outlines from Natural Earth, in the public domain.</p>
      </footer>
    </section>
  );
}
