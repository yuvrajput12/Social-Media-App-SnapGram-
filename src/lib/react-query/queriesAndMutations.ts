import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { LikePost, SavedPost, SignInAccount, createPost, createUserAccount, deleteSavedPost, getCurrentUser, getPostById, getRecentPost, signOutAccount } from '../appwrite/api'
import { INewPost, INewUser } from '@/types'
import { QUERY_KEYS } from './queryKeys';


export const useCreateUserAccount = () => {
    return useMutation({
        mutationFn : (user:INewUser) => createUserAccount(user)
    });
}
export const useSignInAccount = () => {
    return useMutation({
        mutationFn : (user :{
            email:string;
            password:string
        }
        ) => SignInAccount(user)
    });
};
export const useSignOutAccount = () => {
    return useMutation({
        mutationFn : signOutAccount
    });
};
export const useCreatePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : (post:INewPost) => createPost(post),
        onSuccess : () => {
        queryClient.invalidateQueries({
          queryKey : [QUERY_KEYS.GET_RECENT_POSTS]
        })
    }

    });
};


export const useGetRecentPosts = () => {
    return useQuery ({
        queryKey : [QUERY_KEYS.GET_RECENT_POSTS],
        queryFn : getRecentPost,

    })
}

export const useLikePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn : ({postId , likesArray} : {postId : string; likesArray: string[]}) => LikePost(postId,likesArray),
        onSuccess : (data) => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_CURRENT_USER]
            })
        }
    })
}
export const useSavePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn : ({postId , userId} : {postId : string; userId: string}) => SavedPost(postId,userId),
        onSuccess : () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_CURRENT_USER]
            })
        }
    })
}
export const useDeleteSavePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn : (savedRecordId : string ) => deleteSavedPost(savedRecordId),
        onSuccess : () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_CURRENT_USER]
            })
        }
    })
}

export const useGetCurrentUser = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
        queryFn: getCurrentUser
    })
}

export const useGetPostById = (postId : string) => {
  return useQuery({
    queryKey : [QUERY_KEYS.GET_POST_BY_ID,postId],
    queryFn : () => getPostById(postId),
    enabled : !!postId
  })
}
