/**
 * Route-level loading UI for a roadmap page.
 *
 * The page is a server component that awaits TWO signed calls to the dashboard
 * CRM API (meta + snapshot) before it can render anything, so without this the
 * browser sat on a blank white document for the whole round trip.
 * `loading.tsx` gives Next a Suspense boundary to stream immediately, so the
 * dark page shell paints at once and the content fills in when the CRM data
 * arrives.
 *
 * Deliberately copy-free: it mirrors the real page's shell (same dark
 * background, same nav height and spacing) with neutral placeholder blocks, so
 * nothing new is introduced to the design and there is no text that could be
 * mistaken for real roadmap content.
 */
const SKELETON_CSS = `
  .rm-skeleton {
    min-height: 100vh;
    background: #0f1119;
    padding: 0 0 80px;
  }
  .rm-skeleton__nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .rm-skeleton__body {
    max-width: 1120px;
    margin: 0 auto;
    padding: 48px 32px 0;
  }
  .rm-skeleton__bar {
    background: linear-gradient(90deg, rgba(255,255,255,.05) 25%, rgba(255,255,255,.10) 37%, rgba(255,255,255,.05) 63%);
    background-size: 400% 100%;
    border-radius: 8px;
    animation: rm-skeleton-shimmer 1.4s ease-in-out infinite;
  }
  .rm-skeleton__card {
    height: 148px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.07);
    background: rgba(255,255,255,.03);
  }
  .rm-skeleton__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-top: 32px;
  }
  @keyframes rm-skeleton-shimmer {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }
  /* A skeleton that pulses is decoration, not information: hold it still for
     anyone who has asked the OS to reduce motion. */
  @media (prefers-reduced-motion: reduce) {
    .rm-skeleton__bar { animation: none; }
  }
  @media (max-width: 640px) {
    .rm-skeleton__nav { padding: 14px 18px; }
    .rm-skeleton__body { padding: 32px 18px 0; }
  }
`;

export default function RoadmapLoading() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SKELETON_CSS }} />
      <main className="rm-skeleton" aria-busy="true" aria-live="polite">
        <div className="rm-skeleton__nav">
          <div className="rm-skeleton__bar" style={{ width: 104, height: 28 }} />
          <div className="rm-skeleton__bar" style={{ width: 220, height: 28 }} />
        </div>
        <div className="rm-skeleton__body">
          <div className="rm-skeleton__bar" style={{ width: "38%", height: 14, marginBottom: 20 }} />
          <div className="rm-skeleton__bar" style={{ width: "72%", height: 46, marginBottom: 14 }} />
          <div className="rm-skeleton__bar" style={{ width: "56%", height: 46, marginBottom: 28 }} />
          <div className="rm-skeleton__bar" style={{ width: "90%", height: 16, marginBottom: 10 }} />
          <div className="rm-skeleton__bar" style={{ width: "80%", height: 16 }} />
          <div className="rm-skeleton__grid">
            <div className="rm-skeleton__card" />
            <div className="rm-skeleton__card" />
            <div className="rm-skeleton__card" />
            <div className="rm-skeleton__card" />
          </div>
        </div>
      </main>
    </>
  );
}
