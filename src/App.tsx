import { useCallback, useRef } from 'react';
import { AboutSection } from './components/AboutSection';
import { Explorer } from './components/Explorer';
import { SiteHeader } from './components/SiteHeader';
import { useProjects } from './hooks/useProjects';

export default function App() {
  const projects = useProjects();
  const goHome = useRef<(() => void) | null>(null);
  const setGoHome = useCallback((handler: (() => void) | null) => {
    goHome.current = handler;
  }, []);

  return (
    <>
      <a className="skip-link" href="#project-controls">
        Skip to the projects
      </a>
      <SiteHeader onHome={() => goHome.current?.()} />
      {projects.status === 'ready' && projects.projects.length > 0 ? (
        <Explorer projects={projects.projects} onHomeChange={setGoHome} />
      ) : (
        <main className="explorer explorer--empty" id="top">
          <h1 className="visually-hidden">ID-Indetails architecture projects</h1>
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
