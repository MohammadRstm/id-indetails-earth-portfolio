import { AboutSection } from './components/AboutSection';
import { Explorer } from './components/Explorer';
import { SiteHeader } from './components/SiteHeader';
import { useProjects } from './hooks/useProjects';

export default function App() {
  const projects = useProjects();

  return (
    <>
      <a className="skip-link" href="#project">
        Skip to the selected project
      </a>
      <SiteHeader />
      {projects.status === 'ready' && projects.projects.length > 0 ? (
        <Explorer projects={projects.projects} />
      ) : (
        <main className="explorer explorer--empty" id="top">
          <h1 className="visually-hidden">ID-Indetails project globe</h1>
          <p className="explorer__message" role="status">
            {projects.status === 'error'
              ? projects.message
              : projects.status === 'loading'
                ? 'Loading projects'
                : 'There are no projects to show yet.'}
          </p>
        </main>
      )}
      <AboutSection />
    </>
  );
}
