import React, { useState, useRef, useEffect } from "react";

const ROWS = 4;
const STUDENTS_PER_CLASS = 40;
const COLUMNS_PER_CLASS = 10;

const createEmptyPattern = (cols: number) =>
  Array.from({ length: ROWS * cols }, () => ({
    color: "bg-gray-800",
    shape: "square",
  }));

export default function App() {
  const [numClasses, setNumClasses] = useState(1);
  const [cols, setCols] = useState(numClasses * COLUMNS_PER_CLASS);
  const [colors, setColors] = useState(() => createEmptyPattern(cols));
  const [savedPatterns, setSavedPatterns] = useState(() => {
    return JSON.parse(localStorage.getItem("pattern-list") || "{}");
  });
  const [patternName, setPatternName] = useState("");
  const [selectedPattern, setSelectedPattern] = useState("");
  const [animationFrames, setAnimationFrames] = useState<any[][]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  useEffect(() => {
    const newCols = numClasses * COLUMNS_PER_CLASS;
    setCols(newCols);
    setColors(createEmptyPattern(newCols));
    setAnimationFrames([]);
    setSelectedPattern("");
  }, [numClasses]);

  const toggleColor = (index: number) => {
    setColors((prev) =>
      prev.map((cell, i) =>
        i === index
          ? {
              ...cell,
              color:
                cell.color === "bg-gray-800" ? "bg-blue-500" : "bg-gray-800",
            }
          : cell
      )
    );
  };

  const toggleShape = (index: number) => {
    setColors((prev) =>
      prev.map((cell, i) =>
        i === index
          ? {
              ...cell,
              shape:
                cell.shape === "square"
                  ? "triangle-left"
                  : cell.shape === "triangle-left"
                  ? "triangle-right"
                  : "square",
            }
          : cell
      )
    );
  };

  const saveFrame = () => {
    setAnimationFrames((prev) => [...prev, [...colors]]);
  };

  const playAnimation = () => {
    if (isPlaying || animationFrames.length === 0) return;
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => {
        const next = (prev + 1) % animationFrames.length;
        setColors(animationFrames[next]);
        return next;
      });
    }, 500);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const savePattern = () => {
    if (patternName) {
      const updated = { ...savedPatterns, [patternName]: colors };
      localStorage.setItem("pattern-list", JSON.stringify(updated));
      setSavedPatterns(updated);
      setPatternName("");
    }
  };

  const loadPattern = (name: string) => {
    setSelectedPattern(name);
    setColors(savedPatterns[name] || createEmptyPattern(cols));
  };

  const deletePattern = (name: string) => {
    const updated = { ...savedPatterns };
    delete updated[name];
    localStorage.setItem("pattern-list", JSON.stringify(updated));
    setSavedPatterns(updated);
    setSelectedPattern("");
    setColors(createEmptyPattern(cols));
  };

  const clearPattern = () => {
    setColors(createEmptyPattern(cols));
    setAnimationFrames([]);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (e.touches.length === 1 && selectMode) {
      setSelecting(true);
      setStartIndex(index);
      setSelectedIndices([index]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !selecting || startIndex === null) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const id = element?.getAttribute("data-index");
    if (id !== null) {
      const index = Number(id);
      const indices = getRangeIndices(startIndex, index);
      setSelectedIndices(indices);
    }
  };

  const handleMouseDown = (index: number) => {
    if (!selectMode) return;
    setSelecting(true);
    setStartIndex(index);
    setSelectedIndices([index]);
  };

  const handleMouseEnter = (index: number) => {
    if (!selecting || !selectMode) return;
    if (startIndex === null) return;
    const indices = getRangeIndices(startIndex, index);
    setSelectedIndices(indices);
  };

  const handleEndSelection = () => {
    if (!selectMode) return;
    setSelecting(false);
    setColors((prev) =>
      prev.map((cell, i) =>
        selectedIndices.includes(i)
          ? {
              ...cell,
              color:
                cell.color === "bg-gray-800" ? "bg-blue-500" : "bg-gray-800",
            }
          : cell
      )
    );
    setSelectedIndices([]);
  };

  const getRangeIndices = (start: number, end: number) => {
    const [startRow, startCol] = [Math.floor(start / cols), start % cols];
    const [endRow, endCol] = [Math.floor(end / cols), end % cols];
    const top = Math.min(startRow, endRow);
    const bottom = Math.max(startRow, endRow);
    const left = Math.min(startCol, endCol);
    const right = Math.max(startCol, endCol);

    const indices = [];
    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        indices.push(r * cols + c);
      }
    }
    return indices;
  };

  return (
    <div
      className="p-4 select-none overflow-hidden touch-none"
      onMouseUp={handleEndSelection}
      onTouchEnd={handleEndSelection}
    >
      <h1 className="text-xl font-bold mb-4 text-center">
        応援パフォーマンスシミュレーター
      </h1>

      <div className="flex justify-center items-center flex-wrap gap-2 mb-4">
        <label>
          クラス数：
          <select
            value={numClasses}
            onChange={(e) => setNumClasses(Number(e.target.value))}
            className="ml-2 border rounded px-2 py-1"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}クラス
              </option>
            ))}
          </select>
        </label>
        <input
          type="text"
          placeholder="パターン名を入力"
          className="border px-2 py-1 rounded"
          value={patternName}
          onChange={(e) => setPatternName(e.target.value)}
        />
        <button
          onClick={savePattern}
          className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          保存
        </button>
        <select
          value={selectedPattern}
          onChange={(e) => loadPattern(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">パターンを選択</option>
          {Object.keys(savedPatterns).map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        {selectedPattern && (
          <button
            onClick={() => deletePattern(selectedPattern)}
            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            削除
          </button>
        )}
        <button
          onClick={clearPattern}
          className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          クリア
        </button>
        <button
          onClick={() => setSelectMode((prev) => !prev)}
          className={`px-4 py-1 text-white rounded ${
            selectMode ? "bg-yellow-600" : "bg-yellow-500 hover:bg-yellow-600"
          }`}
        >
          範囲選択{selectMode ? "中" : ""}
        </button>
        <button
          onClick={saveFrame}
          className="px-4 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          フレーム保存
        </button>
        <button
          onClick={playAnimation}
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          再生
        </button>
        <button
          onClick={stopAnimation}
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          停止
        </button>
      </div>

      <div className="overflow-auto max-w-full touch-pan-x touch-pan-y touch-pinch-zoom">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `40px repeat(${cols}, minmax(16px, 1fr))`,
          }}
        >
          <div></div>
          {Array.from({ length: cols }, (_, col) => (
            <div key={col} className="text-center text-xs text-gray-600">
              {col + 1}
            </div>
          ))}

          {Array.from({ length: ROWS }).map((_, row) => (
            <React.Fragment key={`row-${row}`}>
              <div className="flex items-center justify-center text-xs text-gray-600">
                {row + 1}
              </div>
              {Array.from({ length: cols }).map((_, col) => {
                const index = row * cols + col;
                const isSelected = selectedIndices.includes(index);

                return (
                  <div
                    key={index}
                    data-index={index}
                    className={`aspect-[3/5] ${colors[index].color} ${
                      isSelected
                        ? "ring-2 ring-yellow-300"
                        : "border border-gray-400"
                    } cursor-pointer`}
                    onMouseDown={() => handleMouseDown(index)}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={handleTouchMove}
                    onClick={() => !selectMode && toggleColor(index)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleShape(index);
                    }}
                    style={parseShape(colors[index].shape)}
                  ></div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function parseShape(shape: string) {
  switch (shape) {
    case "triangle-left":
      return {
        clipPath: "polygon(100% 0%, 0% 50%, 100% 100%)",
      };
    case "triangle-right":
      return {
        clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
      };
    default:
      return {};
  }
}
