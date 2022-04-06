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
    <>
      <h1>추억 라디오</h1>
      <h3>
        타블로 꿈꾸라 2기 <br />
        2014년 4월 21일 ~ 2015년 11월 15일
      </h3>

      <input
        value={searchValue}
        placeholder="제목을 입력해주세요"
        // https://preactjs.com/guide/v10/differences-to-react/#use-oninput-instead-of-onchange
        onInput={handleChange}
      />

      <ol style={{ height: "100%" }}>
        {rows.map((row) => (
          <li>
            <p class="radio-date">{dayjs(row.PubDate).format("YYYY-MM-DD")}</p>
            <p>{row.ContentTitle}</p>

            <a
              href={row.EncloserURL}
              download={row.ContentTitle}
              target="_blank"
            >
              링크
            </a>
          </li>
        ))}
      </ol>
    </>
  );
}
