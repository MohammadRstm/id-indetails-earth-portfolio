import { useState } from 'react';
import type { ProjectImage } from '../data/project';
import { LoadedImage } from './LoadedImage';
import { PhotoViewer } from './ProjectGallery';

interface ProjectConceptProps {
  images: ProjectImage[];
  description: string | null;
  title: string;
}

/**
 * The project's concept, under its description: the concept pictures on the
 * left and their text on the right, so the page zigzags. The first picture is
 * the main one and keeps the left half once there are others: two share the
 * width, and the rest stack beside it, three in a column, four in a 2×2 block
 * (`.concept__grid[data-count]`). Each opens the viewer, like the gallery.
 * Left out when the project has neither pictures nor text.
 */
export function ProjectConcept({ images, description, title }: ProjectConceptProps) {
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0 && !description) return null;

  return (
    <section className="concept" aria-labelledby="concept-title" data-pictures={images.length > 0}>
      {images.length > 0 && (
        <ul className="concept__grid" data-count={images.length}>
          {images.map((image, index) => (
            <li key={image.src}>
              <button
                type="button"
                className="concept__item"
                aria-label={`Open concept picture ${index + 1} of ${images.length}: ${image.alt}`}
                onClick={() => setOpen(index)}
              >
                <LoadedImage src={image.src} alt="" loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="concept__text">
        <h3 id="concept-title">Concept</h3>
        {description && <p className="project-page__lead">{description}</p>}
      </div>
      {open !== null && <PhotoViewer images={images} start={open} title={`${title}, concept`} onClose={() => setOpen(null)} />}
    </section>
  );
}
