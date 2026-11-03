import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  checkPreviewParams,
  getCleanUrlWithoutPreview,
  DEFAULT_TEST_VIDEO_ID,
  isYouTubeShort,
} from './previewVideo';

test('extractYouTubeVideoId parses clean 11-char video ID', () => {
  assert.equal(extractYouTubeVideoId('SjgMmo6_DH0'), 'SjgMmo6_DH0');
  assert.equal(extractYouTubeVideoId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeVideoId('M7lc1UVf-VE'), 'M7lc1UVf-VE');
  assert.equal(extractYouTubeVideoId('abc_123-XYZ'), 'abc_123-XYZ');
});

test('extractYouTubeVideoId extracts SjgMmo6_DH0 from full youtube URLs', () => {
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/watch?v=SjgMmo6_DH0'),
    'SjgMmo6_DH0'
  );
  assert.equal(
    extractYouTubeVideoId('https://youtu.be/SjgMmo6_DH0'),
    'SjgMmo6_DH0'
  );
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/embed/SjgMmo6_DH0'),
    'SjgMmo6_DH0'
  );
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/watch?v=SjgMmo6_DH0&t=10s'),
    'SjgMmo6_DH0'
  );
});

test('extractYouTubeVideoId extracts video ID from YouTube Shorts URLs and paths', () => {
  // Direct Shorts path
  assert.equal(extractYouTubeVideoId('/shorts/GkrGBnipZzE'), 'GkrGBnipZzE');
  assert.equal(extractYouTubeVideoId('shorts/GkrGBnipZzE'), 'GkrGBnipZzE');

  // Full YouTube Shorts URLs
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/shorts/GkrGBnipZzE'),
    'GkrGBnipZzE'
  );
  assert.equal(
    extractYouTubeVideoId('https://youtube.com/shorts/GkrGBnipZzE?feature=share'),
    'GkrGBnipZzE'
  );
  assert.equal(
    extractYouTubeVideoId('https://youtube.com/shorts/GkrGBnipZzE/'),
    'GkrGBnipZzE'
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

test('getYouTubeEmbedUrl constructs safe embed URL with origin and autoplay', () => {
  const url = getYouTubeEmbedUrl('SjgMmo6_DH0', { origin: 'https://example.com' });
  assert.equal(
    url,
    'https://www.youtube.com/embed/SjgMmo6_DH0?autoplay=1&rel=0&controls=1&modestbranding=1&playsinline=1&enablejsapi=1&origin=https%3A%2F%2Fexample.com'
  );
});

test('checkPreviewParams detects presence of v parameter in search query', () => {
  const emptyRes = checkPreviewParams('', '', false);
  assert.equal(emptyRes.shouldOpen, false);
  assert.equal(emptyRes.videoId, null);

  const validRes = checkPreviewParams('?v=SjgMmo6_DH0', '', false);
  assert.equal(validRes.shouldOpen, true);
  assert.equal(validRes.videoId, 'SjgMmo6_DH0');

  const hashRes = checkPreviewParams('', '#v=SjgMmo6_DH0', false);
  assert.equal(hashRes.shouldOpen, true);
  assert.equal(hashRes.videoId, 'SjgMmo6_DH0');

  const fallbackRes = checkPreviewParams('', '', true);
  assert.equal(fallbackRes.shouldOpen, true);
  assert.equal(fallbackRes.videoId, DEFAULT_TEST_VIDEO_ID);
});

test('isYouTubeShort identifies shorts URLs and query parameters', () => {
  assert.equal(isYouTubeShort('/shorts/GkrGBnipZzE'), true);
  assert.equal(isYouTubeShort('shorts/GkrGBnipZzE'), true);
  assert.equal(isYouTubeShort('https://www.youtube.com/shorts/GkrGBnipZzE'), true);
  assert.equal(isYouTubeShort('?v=GkrGBnipZzE&type=short'), true);
  assert.equal(isYouTubeShort('https://www.youtube.com/watch?v=SjgMmo6_DH0'), false);
  assert.equal(isYouTubeShort('SjgMmo6_DH0'), false);
});

test('checkPreviewParams detects YouTube Shorts from pathname or v parameter', () => {
  // Direct pathname
  const pathRes = checkPreviewParams('', '', false, '/shorts/GkrGBnipZzE');
  assert.equal(pathRes.shouldOpen, true);
  assert.equal(pathRes.videoId, 'GkrGBnipZzE');
  assert.equal(pathRes.isShort, true);

  // Parameter with /shorts/ path
  const paramShortRes = checkPreviewParams('?v=/shorts/GkrGBnipZzE', '', false);
  assert.equal(paramShortRes.shouldOpen, true);
  assert.equal(paramShortRes.videoId, 'GkrGBnipZzE');
  assert.equal(paramShortRes.isShort, true);

  // Parameter with full shorts URL
  const fullShortUrlRes = checkPreviewParams('?v=https://youtube.com/shorts/GkrGBnipZzE', '', false);
  assert.equal(fullShortUrlRes.shouldOpen, true);
  assert.equal(fullShortUrlRes.videoId, 'GkrGBnipZzE');
  assert.equal(fullShortUrlRes.isShort, true);
});

test('getCleanUrlWithoutPreview strips v and title preserving other parameters', () => {
  const cleaned1 = getCleanUrlWithoutPreview('?v=SjgMmo6_DH0', '/');
  assert.equal(cleaned1, '/');

  const cleaned2 = getCleanUrlWithoutPreview('?v=SjgMmo6_DH0&coupon=SAVE20', '/');
  assert.equal(cleaned2, '/?coupon=SAVE20');
});
