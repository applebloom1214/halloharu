import { useState } from "react";

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
  onUpdate : (updatedContent : string) => void;
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
    onUpdate,
} : PostCardProps){

    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] =useState(content);

    const handleSave = () =>{
        const trimmedContent = editedContent.trim();

        if(trimmedContent === ""){
            return;
        }

        onUpdate(trimmedContent);
        setIsEditing(false);
    };

    const handleCancel = ()=>{
        setEditedContent(content);
        setIsEditing(false);
    };


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
                <div className="min-w-0 flex-1">
                    {isEditing ?(
                        <div>
                            <textarea
                                value={editedContent}
                                onChange={(event)=>setEditedContent(event.target.value)}
                                maxLength={300}
                                className="h-28 w-full resize-none rounded-xl border p-3 outline-none focus:border-emerald-400"
                            />
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                    {editedContent.length} / 300
                                </span>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="rounded-full border px-3 py-1 text-sm text-gray-500"
                                    >
                                        취소    
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={editedContent.trim() === ""}
                                        className={`rounded-full px-3 py-1 text-sm text-white transition-colors ${
                                         editedContent.trim() === ""
                                          ? "cursor-not-allowed bg-gray-300"
                                          : "bg-emerald-400 hover:bg-emerald-500"
                                                 }`}  
                                    >
                                        저장    
                                    </button>             
                                </div>
                            </div>            
                        </div>
                    ) :(
                      <>       
                    <p className="min-w-0 whitespace-pre-wrap break-words">
                        {content}
                    </p>
                    
                    <time
                        dateTime={createdAt}
                        className="mt-2 block text-xs text-gray-400"
                    >
                        {formattedCreatedAt}
                    </time>
                    </>
                    )}  
                </div>

                {!isEditing && (
                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            onClick={()=>{
                                setEditedContent(content);
                                setIsEditing(true);
                            }}
                            className="whitespace-nowrap text-sm text-gray-400 transition-colors hover:text-emerald-600"
                        >
                            수정    
                        </button>    
                        <button
                            type="button"
                            onClick={onDeleteClick}
                            className="whitespace-nowrap text-sm text-gray-400 transition-colors hover:text-red-500"
                         >
                            삭제
                        </button>
                    </div>
                ) }
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