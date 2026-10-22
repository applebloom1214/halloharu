export type SearchPost = {
    id : number;
    user_id : string | null;
    content : string;
    created_at : string;
};

export type SearchResultPost = SearchPost & {
  author_nickname: string;
};

export const SEARCH_RESULTS_PER_PAGE = 10;

export const escapeLikePattern = (value: string) => {
  return value.replace(/[\\%_]/g, "\\$&");
};