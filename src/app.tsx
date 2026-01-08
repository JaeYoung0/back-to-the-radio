import dayjs from "dayjs";
import { data1, data2 } from "./data";
import { useEffect, useState } from "preact/hooks";

// 타블로 꿈꾸라 2기 2014년 4월 21일 ~ 2015년 11월 15일
const formatDate = (date: string) => Number(dayjs(date).format("YYYYMMDD"));

const TABLO_START_DATE = 20140421;
const TABLO_END_DATE = 20151115;

const RADIO_ROWS = [...data1, ...data2]
  .filter((radioItem) => {
    const date = formatDate(radioItem.BroadDate);
    return date >= TABLO_START_DATE && date <= TABLO_END_DATE;
  })
  .sort((a, b) => Number(b.RowNum) - Number(a.RowNum));

export function App() {
  const [rows, setRows] = useState(RADIO_ROWS);
  const [searchValue, setSearchValue] = useState("");

  const handleChange = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    setSearchValue(e.currentTarget.value);
  };

  useEffect(() => {
    setRows(
      RADIO_ROWS.filter((item) => item.ContentTitle.includes(searchValue))
    );
  }, [searchValue]);

  return (
    <div class="radio-body">
      {/* 라디오 표시등 */}
      <div class="radio-indicator">
        <div class="indicator-light"></div>
        <div class="indicator-light"></div>
        <div class="indicator-light"></div>
      </div>

      {/* 헤더 영역 */}
      <header class="radio-header">
        <h1>추억 라디오</h1>
        <h3>
          타블로 꿈꾸라 2기 <br />
          2014년 4월 21일 ~ 2015년 11월 15일
        </h3>
      </header>

      {/* 스피커 그릴 장식 */}
      <div class="speaker-grill">
        <div class="grill-line"></div>
        <div class="grill-line"></div>
        <div class="grill-line"></div>
        <div class="grill-line"></div>
        <div class="grill-line"></div>
      </div>

      {/* 다이얼 패널 */}
      <div class="dial-panel">
        {/* 주파수 표시 */}
        <div class="frequency-display">
          <p class="frequency-text">FM 89.1 MHz ─ MBC RADIO</p>
        </div>

        {/* 검색창 */}
        <div class="search-container">
          <input
            value={searchValue}
            placeholder="제목을 입력해주세요"
            onInput={handleChange}
          />
        </div>
      </div>

      {/* 에피소드 카운터 */}
      <div class="episode-counter">
        <p class="counter-text">
          총 <span class="counter-number">{rows.length}</span>개의 추억
        </p>
      </div>

      {/* 에피소드 목록 */}
      <ol>
        {rows.map((row) => (
          <li key={row.PodCastItemIdx}>
            <p class="radio-date">{dayjs(row.PubDate).format("YYYY.MM.DD")}</p>
            <p class="episode-title">{row.ContentTitle}</p>
            <a
              class="play-link"
              href={row.EncloserURL}
              download={row.ContentTitle}
              target="_blank"
            >
              듣기
            </a>
          </li>
        ))}
      </ol>

      {/* 볼륨 노브 장식 */}
      <div class="volume-knobs">
        <div>
          <div class="knob"></div>
          <p class="knob-label">VOLUME</p>
        </div>
        <div>
          <div class="knob"></div>
          <p class="knob-label">TUNING</p>
        </div>
      </div>

      {/* 푸터 */}
      <footer class="radio-footer">
        <p class="footer-text">Made with ♥ for 꿈꾸는 라디오 listeners</p>
      </footer>
    </div>
  );
}
