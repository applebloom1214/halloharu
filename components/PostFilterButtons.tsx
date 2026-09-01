type PostFilter = "all" | "mine";

type PostFilterButtonsProps = {
  selectedFilter: PostFilter;
  onFilterChange: (filter: PostFilter) => void;
};

export default function PostFilterButtons({
  selectedFilter,
  onFilterChange,
}: PostFilterButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onFilterChange("all")}
        className={`rounded-full px-3 py-1 text-sm transition ${
          selectedFilter === "all"
            ? "bg-emerald-400 text-white"
            : "border bg-white text-gray-500 hover:bg-gray-50"
        }`}
      >
        전체 기록
      </button>

      <button
        type="button"
        onClick={() => onFilterChange("mine")}
        className={`rounded-full px-3 py-1 text-sm transition ${
          selectedFilter === "mine"
            ? "bg-emerald-400 text-white"
            : "border bg-white text-gray-500 hover:bg-gray-50"
        }`}
      >
        내 기록
      </button>
    </div>
  );
}