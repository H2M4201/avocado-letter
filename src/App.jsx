import { useEffect, useState } from "react";

const LINES_PER_PAGE = 10;

function paginate(text) {
  const scene = document.createElement("div");
  scene.className = "book-scene";
  scene.style.cssText = "position:fixed;left:-100000px;top:0;visibility:hidden";
  const book = document.createElement("div");
  book.className = "book";
  const page = document.createElement("div");
  page.className = "page page-left";
  const measure = document.createElement("div");
  measure.className = "page-text";
  page.appendChild(measure);
  book.appendChild(page);
  scene.appendChild(book);
  document.body.appendChild(scene);

  const pageStyle = getComputedStyle(page);
  const contentWidth =
    page.clientWidth -
    parseFloat(pageStyle.paddingLeft) -
    parseFloat(pageStyle.paddingRight);
  measure.style.width = `${contentWidth}px`;
  const lineHeight = parseFloat(getComputedStyle(measure).lineHeight) || 30;
  const maxHeight = LINES_PER_PAGE * lineHeight;

  const tokens = text.split(/(\s+)/);
  const pages = [];
  let current = "";

  for (const token of tokens) {
    if (!token) continue;
    const candidate = current + token;
    measure.textContent = candidate.trimEnd();
    if (current && measure.getBoundingClientRect().height > maxHeight + 0.5) {
      pages.push(current.trimEnd());
      current = token.trimStart();
    } else {
      current = candidate;
    }
  }
  if (current.trim()) pages.push(current.trimEnd());

  scene.remove();
  return pages.length ? pages : [text];
}

export default function App() {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const [coverAnim, setCoverAnim] = useState(false);
  const [spread, setSpread] = useState(0);
  const [flipping, setFlipping] = useState(null);
  const [text, setText] = useState("Đang tải thư...");

  const [pages, setPages] = useState([text]);

  // Chia nội dung thành các trang khi text/font đã sẵn sàng
  useEffect(() => {
    const compute = () => setPages(paginate(text));
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(compute);
    } else {
      compute();
    }
    const onResize = () => setPages(paginate(text));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [text]);

  // Đọc nội dung thư từ public/letter.txt
  useEffect(() => {
    fetch("/letter.txt")
      .then((r) => r.text())
      .then(setText)
      .catch(() => setText("Không đọc được file letter.txt 😢"));
  }, []);

  // Nhấn Esc để đóng thư
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openLetter = () => {
    setOpened(false);
    setCoverAnim(false);
    setSpread(0);
    setFlipping(null);
    setOpen(true);
  };

  const totalPages = pages.length;
  const lastIdx = totalPages - 1;

  const leftIdx = spread * 2;
  const rightIdx = spread * 2 + 1;

  const pageAt = (i) => (i >= 0 && i < totalPages ? pages[i] : null);
  const isLast = (i) => i === lastIdx;

  const canNext = !flipping && rightIdx + 1 < totalPages;
  const canPrev = !flipping && spread > 0;

  const next = () => canNext && setFlipping("next");
  const prev = () => canPrev && setFlipping("prev");

  const onFlipEnd = () => {
    if (flipping === "next") setSpread((s) => s + 1);
    else if (flipping === "prev") setSpread((s) => s - 1);
    setFlipping(null);
  };

  let baseLeftIdx = leftIdx;
  let baseRightIdx = rightIdx;
  let leafFrontIdx = null;
  let leafBackIdx = null;

  if (flipping === "next") {
    leafFrontIdx = rightIdx;
    leafBackIdx = rightIdx + 1;
    baseRightIdx = rightIdx + 2;
  } else if (flipping === "prev") {
    leafFrontIdx = leftIdx - 1;
    leafBackIdx = leftIdx;
    baseLeftIdx = leftIdx - 2;
    baseRightIdx = leftIdx - 1;
  }

  return (
    <main className="stage">
      <svg className="avocado" viewBox="0 0 300 372" aria-label="Trái bơ dễ thương cầm lá thư">
        <g transform="translate(0 -4) scale(1 0.93)">
        {/* thân bơ */}
        <path
          d="M150 20 C95 20 60 120 50 215 C42 300 90 380 150 380 C210 380 258 300 250 215 C240 120 205 20 150 20 Z"
          fill="#5c8a3a"
        />
        <path
          d="M150 42 C108 42 78 130 70 215 C63 288 102 358 150 358 C198 358 237 288 230 215 C222 130 192 42 150 42 Z"
          fill="#d9e8a0"
        />
        {/* hạt */}
        <circle cx="150" cy="270" r="48" fill="#8a5a3b" />
        <ellipse cx="136" cy="254" rx="12" ry="8" fill="#b07a55" opacity="0.7" />

        {/* mặt */}
        <circle cx="120" cy="150" r="8" fill="#2b2b2b" />
        <circle cx="180" cy="150" r="8" fill="#2b2b2b" />
        <circle cx="123" cy="147" r="2.5" fill="#fff" />
        <circle cx="183" cy="147" r="2.5" fill="#fff" />
        <ellipse cx="100" cy="175" rx="12" ry="7" fill="#f5a3a3" opacity="0.8" />
        <ellipse cx="200" cy="175" rx="12" ry="7" fill="#f5a3a3" opacity="0.8" />
        <path d="M138 172 Q150 188 162 172" stroke="#2b2b2b" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* tay trái + phải */}
        <path d="M62 235 Q85 270 125 262" stroke="#5c8a3a" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M238 235 Q215 270 175 262" stroke="#5c8a3a" strokeWidth="14" fill="none" strokeLinecap="round" />

        {/* lá thư (bấm được) */}
        <g className="letter" role="button" tabIndex="0" aria-label="Mở lá thư"
           onClick={openLetter}
           onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openLetter()}>
          <rect x="105" y="235" width="90" height="62" rx="6" fill="#fff8e7" stroke="#e0b97a" strokeWidth="3" />
          <path d="M105 241 L150 273 L195 241" stroke="#e0b97a" strokeWidth="3" fill="none" strokeLinejoin="round" />
        </g>

        {/* chân */}
        <ellipse cx="115" cy="378" rx="22" ry="10" fill="#5c8a3a" />
        <ellipse cx="185" cy="378" rx="22" ry="10" fill="#5c8a3a" />
        </g>
      </svg>
      <p className="hint">Mít ơi, bạn có thư nè. Bấm vào đây để đọc nha ✉️</p>

      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="book-scene" onClick={(e) => e.stopPropagation()}>
            <div className="book">
              <div className="page page-left" onClick={prev}>
                <PageContent content={pageAt(baseLeftIdx)} last={isLast(baseLeftIdx)} />
              </div>
              <div className="page page-right" onClick={next}>
                <PageContent content={pageAt(baseRightIdx)} last={isLast(baseRightIdx)} />
              </div>

              {flipping && (
                <div
                  className={`leaf ${flipping === "next" ? "flip-next" : "flip-prev"}`}
                  onAnimationEnd={onFlipEnd}
                >
                  <div className="leaf-face leaf-front">
                    <PageContent content={pageAt(leafFrontIdx)} last={isLast(leafFrontIdx)} />
                  </div>
                  <div className="leaf-face leaf-back">
                    <PageContent content={pageAt(leafBackIdx)} last={isLast(leafBackIdx)} />
                  </div>
                </div>
              )}
            </div>

            {!opened && (
              <button
                className={`cover ${coverAnim ? "cover-open" : ""}`}
                onClick={() => setCoverAnim(true)}
                onAnimationEnd={() => {
                  setCoverAnim(false);
                  setOpened(true);
                }}
              >
                <span className="cover-emoji">🥑</span>
                <span className="cover-title">Gửi tới Mít từ Sài Gòn</span>
                <span className="cover-sub">Bấm để mở nhé</span>
              </button>
            )}

            <button className="close-btn" aria-label="Đóng" onClick={() => setOpen(false)}>
              ✕
            </button>
            <p className="book-hint">
              {opened ? "Bấm mép trang để lật tiếp ↺" : "Bấm vào thiệp để mở"}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function PageContent({ content, last }) {
  if (content === null) return null;
  if (!last) return <div className="page-text">{content}</div>;

  const trimmed = content.replace(/\s+$/, "");
  const lines = trimmed.split("\n");
  const signature = lines.pop() ?? "";

  return (
    <div className="page-text">
      {lines.join("\n")}
      <div className="page-sign">{signature}</div>
    </div>
  );
}
