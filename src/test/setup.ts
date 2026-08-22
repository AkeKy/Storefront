import '@testing-library/jest-dom/vitest';
import type { ComponentPropsWithoutRef } from 'react';
import { vi } from 'vitest';

type MockNextImageProps = Omit<ComponentPropsWithoutRef<'img'>, 'src'> & {
  src: string | { src: string };
  fill?: boolean;
  priority?: boolean;
  loader?: unknown;
  quality?: number | string;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
  overrideSrc?: string;
  onLoadingComplete?: (image: HTMLImageElement) => void;
};

vi.mock('next/image', async () => {
  const { createElement, forwardRef } = await import('react');
  const TestImage = forwardRef<HTMLImageElement, MockNextImageProps>(function TestImage(
    {
      src,
      fill: _fill,
      priority: _priority,
      loader: _loader,
      quality: _quality,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      unoptimized: _unoptimized,
      overrideSrc: _overrideSrc,
      onLoadingComplete: _onLoadingComplete,
      ...imageProps
    },
    ref
  ) {
    return createElement('img', {
      ...imageProps,
      ref,
      src: typeof src === 'string' ? src : src.src,
    });
  });

  TestImage.displayName = 'TestImage';

  return { default: TestImage };
});
