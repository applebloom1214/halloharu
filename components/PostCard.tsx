type PostCardProps ={
  content: string;
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
    return( 
        <div className="rounded-2xl border bg-white p-4">
            
            <div className="flex items-start justify-between gap-4">
                <p className="min-w-0 whitespace-pre-wrap break-words">
                    {content}
                </p>

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