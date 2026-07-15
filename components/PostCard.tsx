type PostCardProps ={
    content : string;
}

export default function PostCard({content} : PostCardProps){
    return( 
        <div className="rounded-2xl border bg-white p-4">
            <p>{content}</p>

            <div className="mt-3 text-sm text-gray-500">
            🌱 공감 0 · 💪 응원 0 · 😊 미소 0                                
            </div>
        </div>
    );
}