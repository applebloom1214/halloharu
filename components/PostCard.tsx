type PostCardProps ={
  content: string;
  createdAt : string;
  empathyCount: number;
  cheerCount: number;
  smileCount: number;
  isEmpathized : boolean;
  isCheered : boolean;
  isSmiled : boolean;
  onEmpathyClick : () => void;
  onCheerClick : () => void;
  onSmileClick : () => void;
  onDeleteClick : () => void;
}

export default function PostCard({
    content,
    createdAt,
    empathyCount,
    cheerCount,
    smileCount,
    isEmpathized,
    isCheered,
    isSmiled,
    onEmpathyClick,
    onCheerClick,
    onSmileClick,
    onDeleteClick,
} : PostCardProps){

    const date = new Date(createdAt);

    const koreaDate = new Date(
        date.getTime() + 9 * 60 * 60 * 1000,
    );

    const year = koreaDate.getUTCFullYear();
    const month = koreaDate.getUTCMonth() +1;
    const day = koreaDate.getUTCDate();
    const hour = koreaDate.getUTCHours();
    const minute = koreaDate
            .getUTCMinutes()
            .toString()
            .padStart(2,"0");
    
    const period = hour < 12 ? "오전" : "오후";
    const displayHour = hour % 12 || 12;

    const formattedCreatedAt =
        `${year}년 ${month}월 ${day}일 ${period} ${displayHour}:${minute}`;

    return( 
        <div className="rounded-2xl border bg-white p-4"> 
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">     
                    <p className="min-w-0 whitespace-pre-wrap break-words">
                        {content}
                    </p>
                    
                    <time
                        dateTime={createdAt}
                        className="mt-2 block text-xs text-gray-400"
                    >
                        {formattedCreatedAt}
                    </time>
                </div>

                <button
                    type="button"
                    onClick={onDeleteClick}
                    className="shrinnk-0 text-sm text-gray-400 transition hover:text-red-500"
                >
                    삭제
                </button>
            </div>
            

            <div className="mt-3 text-sm text-gray-500">
            <button
                type="button"
                onClick={onEmpathyClick}
                className={`rounded-full px-2 py-1 transition ${
                    isEmpathized
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
             >
                          
            🌱 공감 {empathyCount}
            </button>
            
            <span>·</span>  
            
            <button
                type="button"
                onClick={onCheerClick}
                className={`rounded-full px-2 py-1 transition ${
                    isCheered
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-500 hover:bg-gray-100"
                }`}
            >
                💪 응원 {cheerCount}
            </button>    
            
            <span>·</span>

             <button
                type="button"
                onClick={onSmileClick}
                className={`rounded-full px-2 py-1 transition ${
                    isSmiled
                        ? "bg-yellow-100 text-yellow-700"
                        : "text-gray-500 hover:bg-gray-100"
                }`}
            >
                😊 미소 {smileCount}  
             </button>               
                                       
            </div>
        </div>
    );
}