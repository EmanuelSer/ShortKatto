import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  checkPreviewParams,
  getCleanUrlWithoutPreview,
} from './previewVideo';

test('extractYouTubeVideoId parses clean 11-char video ID', () => {
  assert.equal(extractYouTubeVideoId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeVideoId('M7lc1UVf-VE'), 'M7lc1UVf-VE');
  assert.equal(extractYouTubeVideoId('abc_123-XYZ'), 'abc_123-XYZ');
});

test('extractYouTubeVideoId extracts ID from full youtube URLs', () => {
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s'),
    'dQw4w9WgXcQ'
  );
});

test('extractYouTubeVideoId rejects invalid inputs and injection attempts', () => {
  assert.equal(extractYouTubeVideoId(null), null);
  assert.equal(extractYouTubeVideoId(undefined), null);
  assert.equal(extractYouTubeVideoId(''), null);
  assert.equal(extractYouTubeVideoId('   '), null);
  assert.equal(extractYouTubeVideoId('<script>alert(1)</script>'), null);
  assert.equal(extractYouTubeVideoId('tooShort'), null);
  assert.equal(extractYouTubeVideoId('wayTooLongVideoId1234567890'), null);
  assert.equal(extractYouTubeVideoId('invalid$char!'), null);
});

test('getYouTubeEmbedUrl constructs safe nocookie embed URL with autoplay', () => {
  const url = getYouTubeEmbedUrl('dQw4w9WgXcQ');
  assert.equal(
    url,
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&controls=1&modestbranding=1&playsinline=1'
  );
});

test('checkPreviewParams detects presence of v parameter in search query', () => {
  const emptyRes = checkPreviewParams('');
  assert.equal(emptyRes.shouldOpen, false);
  assert.equal(emptyRes.videoId, null);

  const noVRes = checkPreviewParams('?ref=twitter&plan=pro');
  assert.equal(noVRes.shouldOpen, false);
  assert.equal(noVRes.videoId, null);

  const validRes = checkPreviewParams('?v=dQw4w9WgXcQ');
  assert.equal(validRes.shouldOpen, true);
  assert.equal(validRes.videoId, 'dQw4w9WgXcQ');

  const withTitleRes = checkPreviewParams('?v=dQw4w9WgXcQ&title=Product+Demo+v2');
  assert.equal(withTitleRes.shouldOpen, true);
  assert.equal(withTitleRes.videoId, 'dQw4w9WgXcQ');
  assert.equal(withTitleRes.customTitle, 'Product Demo v2');
});

test('getCleanUrlWithoutPreview strips v and title preserving other parameters', () => {
  const cleaned1 = getCleanUrlWithoutPreview('?v=dQw4w9WgXcQ', '/');
  assert.equal(cleaned1, '/');

  const cleaned2 = getCleanUrlWithoutPreview('?v=dQw4w9WgXcQ&coupon=SAVE20', '/');
  assert.equal(cleaned2, '/?coupon=SAVE20');

  const cleaned3 = getCleanUrlWithoutPreview('?v=dQw4w9WgXcQ&title=Demo', '/index.html');
  assert.equal(cleaned3, '/index.html');
});
