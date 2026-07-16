type PostCardProps ={
  content: string;
  empathyCount: number;
  cheerCount: number;
  smileCount: number;
  onEmpathyClick : () => void;
}

export default function PostCard({
    content,
    empathyCount,
    cheerCount,
    smileCount,
    onEmpathyClick,
} : PostCardProps){
    return( 
        <div className="rounded-2xl border bg-white p-4">
            <p>{content}</p>

            <div className="mt-3 text-sm text-gray-500">
            <button
                type="button"
                onClick={onEmpathyClick}
                className="rounded-full px-2 py-1 hover:bg-gray-100">
            🌱 공감 {empathyCount}
            </button>
            
            <span>·</span>  
            <span>💪 응원 {cheerCount}</span>
            <span>·</span>
            <span>😊 미소 {smileCount}</span>                                 
            </div>
        </div>
    );
}