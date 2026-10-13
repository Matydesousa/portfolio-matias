import type { Project } from './projects';
import { getProjects } from '../i18n/content';
import { getUI, projectPath, type Locale } from '../i18n/ui';

export interface TourStop {
  target: string;
  focus?: string;
  title: string;
  message: string;
}

export function getPortfolioTour(locale: Locale = 'es'): TourStop[] {
  const t = getUI(locale);
  return [
    {
      target: '.intro h1',
      title: t.tourHello,
      message: t.tourIntro,
    },
    ...getProjects(locale).map((project) => ({
      target: `[href="${projectPath(project.slug, locale)}"].repository-link`,
      title: project.title,
      message: project.summary,
    })),
    {
      target: '#sobre-mi > p',
      title: t.tourAbout,
      message: t.tourAboutText,
    },
    {
      target: '.about-stack',
      focus: '[data-stack-group="primary"]',
      title: t.stackTitle,
      message: t.tourStackText,
    },
    {
      target: '.experience-list',
      title: t.experience,
      message: t.tourExperience,
    },
    {
      target: '.development',
      title: t.tourDevelopment,
      message: t.tourDevelopmentText,
    },
    {
      target: '#contacto',
      focus: '.contact-links',
      title: t.tourContact,
      message: t.tourContactText,
    },
  ];
}

export const portfolioTour = getPortfolioTour();

export function getProjectTour(
  project: Project,
  hasImage: boolean,
  locale: Locale = 'es',
): TourStop[] {
  const t = getUI(locale);
  return [
    {
      target: '.case-header h1',
      title: project.title,
      message: project.summary,
    },
    {
      target: '.tags',
      title: t.tourTechnologies,
      message: `${t.tourTechnologiesText}: ${project.stack.join(', ')}.`,
    },
    {
      target: '.case-header .button',
      title: t.tourCode,
      message: t.tourCodeText,
    },
    ...(project.website
      ? [
          {
            target: '.project-live-links',
            title: t.tourVisit,
            message: t.tourVisitText,
          },
        ]
      : []),
    ...(hasImage
      ? [
          {
            target: '.case-image',
            focus: '.image-stage',
            title: t.tourImage,
            message: t.tourImageText,
          },
        ]
      : []),
    {
      target: '[aria-labelledby="problem-title"]',
      focus: 'p',
      title: t.tourProblem,
      message: project.problem,
    },
    ...project.features.map((feature, index) => ({
      target: '[aria-labelledby="features-title"]',
      focus: `.project-features > div:nth-child(${index + 1})`,
      title: feature.title,
      message: feature.description,
    })),
    ...project.workflow.map((step, index) => ({
      target: '[aria-labelledby="workflow-title"]',
      focus: `.workflow-list > li:nth-child(${index + 1})`,
      title: step.title,
      message: step.description,
    })),
    {
      target: '[aria-labelledby="workflow-title"]',
      focus: '.project-example',
      title: t.example,
      message: project.example,
    },
    ...(project.gallery?.length
      ? [
          {
            target: '.project-gallery',
            focus: '.gallery-grid li:first-child img',
            title: t.tourGallery,
            message: t.tourGalleryText,
          },
        ]
      : []),
    {
      target: '[aria-labelledby="contribution-title"]',
      focus: 'p',
      title: t.contribution,
      message: project.contribution,
    },
    ...project.decisions.map((decision, index) => ({
      target: '[aria-labelledby="decisions-title"]',
      focus: `.decision-list > li:nth-child(${index + 1})`,
      title: t.tourDecision,
      message: decision,
    })),
    {
      target: '[aria-labelledby="scope-title"]',
      focus: 'p',
      title: t.tourScope,
      message: project.scope,
    },
    {
      target: '.project-ribbon',
      focus: '.ribbon-viewport',
      title: t.tourNext,
      message: t.tourNextText,
    },
  ];
}
