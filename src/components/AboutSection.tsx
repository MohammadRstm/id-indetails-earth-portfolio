export function AboutSection() {
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <div className="about__inner">
        <h2 className="about__title" id="about-title">
          ID-Indetails is a software engineering company.
        </h2>
        <div className="about__body">
          <p>
            We design, build and look after software: web platforms, internal tools and the data systems underneath them.
          </p>
          <p>
            The projects on the globe are sample entries made for this preview. They show how work will be presented once case
            studies are published, and none of them describes an actual client.
          </p>
        </div>
      </div>
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} ID-Indetails</p>
        <p>
          Earth imagery from NASA Earth Observatory (Blue Marble Next Generation, Black Marble 2016) and GEBCO, in the public
          domain.
        </p>
      </footer>
    </section>
  );
}
