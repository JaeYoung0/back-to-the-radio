import dayjs from "dayjs";
import { data1, data2 } from "./data";
import { useEffect, useState, useMemo } from "preact/hooks";

// 타블로 꿈꾸라 2기 2014년 4월 21일 ~ 2015년 11월 15일
const formatDate = (date: string) => Number(dayjs(date).format("YYYYMMDD"));

const TABLO_START_DATE = 20140421;
const TABLO_END_DATE = 20151115;

const RADIO_ROWS = [...data1, ...data2]
  .filter((radioItem) => {
    const date = formatDate(radioItem.BroadDate);
    return date >= TABLO_START_DATE && date <= TABLO_END_DATE;
  })
  .sort((a, b) => Number(a.RowNum) - Number(b.RowNum));

// 코너(프로그램) 추출 함수
const extractCorner = (title: string): string => {
  // "10/31 금 : 1,2부 다크 러브 (With 김종완)" -> "다크 러브"
  const match = title.match(/\d,\d부\s+(.+?)(?:\s*\(|With|with|\s*$)/);
  if (match) {
    return match[1].trim().replace(/\s*\/.*$/, ''); // "가사집/블로노트" -> "가사집"
  }
  return "기타";
};

// 모든 코너 목록 추출
const ALL_CORNERS = Array.from(
  new Set(RADIO_ROWS.map((row) => extractCorner(row.ContentTitle)))
).sort();

// 뷰 모드 타입
type ViewMode = "list" | "calendar" | "corner";

// 월 데이터 생성
const generateMonthData = (year: number, month: number) => {
  const firstDay = dayjs(`${year}-${month}-01`);
  const daysInMonth = firstDay.daysInMonth();
  const startDayOfWeek = firstDay.day();

  const days: (number | null)[] = [];

  // 이전 달 빈 칸
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // 현재 달 날짜
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
};

// 날짜별 에피소드 그룹화
const groupByDate = (rows: typeof RADIO_ROWS) => {
  const grouped: Record<string, typeof RADIO_ROWS> = {};
  rows.forEach((row) => {
    const date = dayjs(row.BroadDate).format("YYYY-MM-DD");
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(row);
  });
  return grouped;
};

// 코너별 에피소드 그룹화
const groupByCorner = (rows: typeof RADIO_ROWS) => {
  const grouped: Record<string, typeof RADIO_ROWS> = {};
  rows.forEach((row) => {
    const corner = extractCorner(row.ContentTitle);
    if (!grouped[corner]) {
      grouped[corner] = [];
    }
    grouped[corner].push(row);
  });
  return grouped;
};

export function App() {
  const [searchValue, setSearchValue] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCorners, setSelectedCorners] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(() => dayjs("2015-11-01"));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [listDisplayCount, setListDisplayCount] = useState(50);
  const [expandedCorners, setExpandedCorners] = useState<Set<string>>(new Set());

  // 필터링된 행
  const filteredRows = useMemo(() => {
    let rows = RADIO_ROWS;

    // 검색어 필터
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      rows = rows.filter((item) =>
        item.ContentTitle.toLowerCase().includes(searchLower)
      );
    }

    // 코너 필터
    if (selectedCorners.size > 0) {
      rows = rows.filter((item) =>
        selectedCorners.has(extractCorner(item.ContentTitle))
      );
    }

    return rows;
  }, [searchValue, selectedCorners]);

  // 검색어 제안 (자동완성)
  const suggestions = useMemo(() => {
    if (!searchValue || searchValue.length < 2) return [];

    const searchLower = searchValue.toLowerCase();
    const matches = new Set<string>();

    RADIO_ROWS.forEach((row) => {
      // 게스트 이름 추출
      const guestMatch = row.ContentTitle.match(/(?:With|with)\s+([^)]+)/);
      if (guestMatch && guestMatch[1].toLowerCase().includes(searchLower)) {
        matches.add(guestMatch[1].trim());
      }

      // 코너 이름
      const corner = extractCorner(row.ContentTitle);
      if (corner.toLowerCase().includes(searchLower)) {
        matches.add(corner);
      }
    });

    return Array.from(matches).slice(0, 5);
  }, [searchValue]);

  // 날짜별 그룹
  const groupedByDate = useMemo(() => groupByDate(filteredRows), [filteredRows]);

  // 코너별 그룹
  const groupedByCorner = useMemo(() => groupByCorner(filteredRows), [filteredRows]);

  // 현재 월의 날짜들
  const monthDays = useMemo(
    () => generateMonthData(currentMonth.year(), currentMonth.month() + 1),
    [currentMonth]
  );

  const handleChange = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    setSearchValue(e.currentTarget.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchValue(suggestion);
    setShowSuggestions(false);
  };

  const toggleCorner = (corner: string) => {
    setSelectedCorners((prev) => {
      const next = new Set(prev);
      if (next.has(corner)) {
        next.delete(corner);
      } else {
        next.add(corner);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchValue("");
    setSelectedCorners(new Set());
  };

  const prevMonth = () => {
    const newMonth = currentMonth.subtract(1, "month");
    if (newMonth.isAfter(dayjs("2014-03-01"))) {
      setCurrentMonth(newMonth);
    }
  };

  const nextMonth = () => {
    const newMonth = currentMonth.add(1, "month");
    if (newMonth.isBefore(dayjs("2015-12-01"))) {
      setCurrentMonth(newMonth);
    }
  };

  const handleDateClick = (day: number | null) => {
    if (!day) return;
    const dateStr = currentMonth.date(day).format("YYYY-MM-DD");
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const getEpisodesForDay = (day: number) => {
    const dateStr = currentMonth.date(day).format("YYYY-MM-DD");
    return groupedByDate[dateStr] || [];
  };

  const loadMoreList = () => {
    setListDisplayCount((prev) => Math.min(prev + 50, filteredRows.length));
  };

  const toggleCornerExpand = (corner: string) => {
    setExpandedCorners((prev) => {
      const next = new Set(prev);
      if (next.has(corner)) {
        next.delete(corner);
      } else {
        next.add(corner);
      }
      return next;
    });
  };

  // 필터 변경 시 리스트 카운트 리셋
  useEffect(() => {
    setListDisplayCount(50);
  }, [searchValue, selectedCorners]);

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

        {/* 뷰 모드 전환 버튼 */}
        <div class="view-mode-buttons">
          <button
            class={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            📻 리스트
          </button>
          <button
            class={`view-btn ${viewMode === "calendar" ? "active" : ""}`}
            onClick={() => setViewMode("calendar")}
          >
            📅 캘린더
          </button>
          <button
            class={`view-btn ${viewMode === "corner" ? "active" : ""}`}
            onClick={() => setViewMode("corner")}
          >
            🎙️ 코너별
          </button>
        </div>

        {/* 검색창 */}
        <div class="search-container">
          <input
            value={searchValue}
            placeholder="제목, 게스트, 코너 검색..."
            onInput={handleChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul class="suggestions-list">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 코너 필터 태그 */}
        <div class="corner-filters">
          <span class="filter-label">코너 필터:</span>
          <div class="corner-tags">
            {ALL_CORNERS.slice(0, 8).map((corner) => (
              <button
                key={corner}
                class={`corner-tag ${selectedCorners.has(corner) ? "active" : ""}`}
                onClick={() => toggleCorner(corner)}
              >
                {corner}
              </button>
            ))}
          </div>
          {(searchValue || selectedCorners.size > 0) && (
            <button class="clear-filters" onClick={clearFilters}>
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* 에피소드 카운터 */}
      <div class="episode-counter">
        <p class="counter-text">
          총 <span class="counter-number">{filteredRows.length}</span>개의 추억
          {selectedCorners.size > 0 && (
            <span class="filter-info">
              ({selectedCorners.size}개 코너 선택됨)
            </span>
          )}
        </p>
      </div>

      {/* 리스트 뷰 */}
      {viewMode === "list" && (
        <ol class="episode-list">
          {filteredRows.slice(0, listDisplayCount).map((row, index) => (
            <li key={row.PodCastItemIdx}>
              <span class="episode-number">{index + 1}일째</span>
              <p class="radio-date">{dayjs(row.PubDate).format("YYYY.MM.DD")}</p>
              <p class="episode-title">{row.ContentTitle}</p>
              <div class="episode-meta">
                <span class="corner-badge">{extractCorner(row.ContentTitle)}</span>
                <a
                  class="play-link"
                  href={row.EncloserURL}
                  download={row.ContentTitle}
                  target="_blank"
                >
                  듣기
                </a>
              </div>
            </li>
          ))}
          {filteredRows.length > listDisplayCount && (
            <button class="load-more-btn" onClick={loadMoreList}>
              더보기 ({filteredRows.length - listDisplayCount}개 더)
            </button>
          )}
        </ol>
      )}

      {/* 캘린더 뷰 */}
      {viewMode === "calendar" && (
        <div class="calendar-view">
          <div class="calendar-header">
            <button class="month-nav" onClick={prevMonth}>◀</button>
            <h2 class="current-month">
              {currentMonth.format("YYYY년 M월")}
            </h2>
            <button class="month-nav" onClick={nextMonth}>▶</button>
          </div>

          <div class="calendar-weekdays">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <div key={day} class="weekday">{day}</div>
            ))}
          </div>

          <div class="calendar-grid">
            {monthDays.map((day, index) => {
              const episodes = day ? getEpisodesForDay(day) : [];
              const dateStr = day ? currentMonth.date(day).format("YYYY-MM-DD") : "";
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={index}
                  class={`calendar-day ${day ? "has-day" : "empty"} ${episodes.length > 0 ? "has-episodes" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => handleDateClick(day)}
                >
                  {day && (
                    <>
                      <span class="day-number">{day}</span>
                      {episodes.length > 0 && (
                        <span class="episode-dot">{episodes.length}</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* 선택된 날짜의 에피소드 */}
          {selectedDate && groupedByDate[selectedDate] && (
            <div class="selected-date-episodes">
              <h3 class="selected-date-title">
                {dayjs(selectedDate).format("YYYY년 M월 D일")} 방송
              </h3>
              <ul class="date-episode-list">
                {groupedByDate[selectedDate].map((row) => (
                  <li key={row.PodCastItemIdx}>
                    <p class="episode-title">{row.ContentTitle}</p>
                    <div class="episode-meta">
                      <span class="corner-badge">{extractCorner(row.ContentTitle)}</span>
                      <a
                        class="play-link"
                        href={row.EncloserURL}
                        download={row.ContentTitle}
                        target="_blank"
                      >
                        듣기
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 코너별 뷰 */}
      {viewMode === "corner" && (
        <div class="corner-view">
          {Object.entries(groupedByCorner)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([corner, episodes]) => {
              const isExpanded = expandedCorners.has(corner);
              const displayEpisodes = isExpanded ? episodes : episodes.slice(0, 5);

              return (
                <div key={corner} class="corner-section">
                  <div class="corner-header">
                    <h3 class="corner-name">{corner}</h3>
                    <span class="corner-count">{episodes.length}회</span>
                  </div>
                  <ul class="corner-episode-list">
                    {displayEpisodes.map((row) => (
                      <li key={row.PodCastItemIdx}>
                        <span class="episode-date">
                          {dayjs(row.PubDate).format("MM.DD")}
                        </span>
                        <span class="episode-title-short">
                          {row.ContentTitle.replace(/^\d+\/\d+\s*\S+\s*:\s*\d,\d부\s*/, '')}
                        </span>
                        <a
                          class="play-link-small"
                          href={row.EncloserURL}
                          target="_blank"
                        >
                          ▶
                        </a>
                      </li>
                    ))}
                  </ul>
                  {episodes.length > 5 && (
                    <button
                      class="corner-expand-btn"
                      onClick={() => toggleCornerExpand(corner)}
                    >
                      {isExpanded ? "접기 ▲" : `+${episodes.length - 5}개 더보기 ▼`}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}

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
