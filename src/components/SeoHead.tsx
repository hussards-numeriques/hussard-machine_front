import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  canonicalUrl,
  documentTitle,
  isTitledPath,
  normalizePath,
  PAGE_TITLE_KEYS,
} from '../lib/seo';

const upsertCanonicalLink = (href: string): void => {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const link = existing ?? document.createElement('link');
  link.rel = 'canonical';
  link.href = href;
  if (!existing) document.head.appendChild(link);
};

export const SeoHead: React.FC = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const path = normalizePath(pathname);
  const title = documentTitle(isTitledPath(path) ? t(PAGE_TITLE_KEYS[path]) : null);

  useEffect(() => {
    document.title = title;
    upsertCanonicalLink(canonicalUrl(path));
  }, [path, title]);

  return null;
};
