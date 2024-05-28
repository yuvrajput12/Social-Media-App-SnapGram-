import { INewPost, INewUser } from '@/types';
import {ID, Query,ImageGravity} from 'appwrite'
import { account, appwriteConfig, avatars, databases, storage } from './config';



////=============================Sign-up====================////

export async function createUserAccount(user: INewUser){
    try {
       const newAccount = await account.create(
        ID.unique(),
        user.email,
        user.password,
        user.name
       ); 

       if(!newAccount) throw Error;

       const avatarUrl = avatars.getInitials(user.name);

       const newUser = await saveUserToDB({
        accountId : newAccount.$id,
        email : newAccount.email,
        name:newAccount.name,
        username : user.username,
        imageUrl : avatarUrl
       })

       return newUser;
    
    } catch (error) {
        console.log("error");
        return error;
        
    }  
    }
///////=======================Save user to database============/////////

    export async function saveUserToDB(user :{
        accountId:string;
        email:string;
        name:string;
        imageUrl: URL;
        username?: string;
    }){
        try {
            const newUser = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                ID.unique(),
                user
            )

            return newUser;
        } catch (error) {
            console.log(error);
            
        }
    }
 //===========================Sign In========================///


  export async function SignInAccount(user:{email:string;password:string}){
       try {
        const currentSession = await getCurrentUser();
        if (currentSession) {
            // Optional: Log out the existing session if you want to force a new session
            await account.deleteSession('current');
        } 
        // create new session
        const session = await account.createEmailPasswordSession(user.email,user.password);

        return session;
       } catch (error) {
        console.log(error);
        
       }
  }

//   async function getCurrentUserSession() {
//     try {
//         const currentAccount = await account.get();
//         return currentAccount;
//     } catch (error: unknown) {
//         if (isAppwriteError(error)) {
//             // If there's no active session, Appwrite throws an error with code 401
//             if (error.code === 401) {
//                 return null; // No active session
//             }
//         }
//         throw error; // Re-throw other errors
//     }
// }
function isAppwriteError(error: any): error is { code: number; message: string } {
    return typeof error === 'object' && 'code' in error && 'message' in error;
}

  ////================ Get Account====================////////

  export async function getCurrentUser() {
    try {
        const  currentAccount = await account.get();

        if(!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );

        if(!currentUser) throw Error

        return currentUser.documents[0];
    }  catch (error) {
        if (isAppwriteError(error)) {
            if (error.code === 401) {
                return null; // No active session
            }
        }
        console.log(error);
        return null;
    }
}


////=====================SignOut=================///

export async function signOutAccount(){
    try {
        const session = await account.deleteSession("current");
        return session;
    } catch (error) {
        console.log(error);
        
        
    }
}

///====================Create Post=================////////

// export async function createPost(post : INewPost){
//     try {
//        //upload image to storage
//        const uploadedFile = await uploadFile(post.file[0]);

//        if(!uploadedFile) throw Error;

//        //Get file Url

//        const fileUrl = getFilePreview(uploadedFile.$id);

//        if(!fileUrl){
//         await deleteFile(uploadedFile.$id);
//         throw Error;
//        }

//        // convert tags into array
//       const tags = post.tags?.replace(/ /g, "").split(",") || [];

//       //save new post into database

//       const newPost = await databases.createDocument(
//         appwriteConfig.databaseId,
//         appwriteConfig.postCollectionId,
//         ID.unique(),
//         {
//           creator: post.userId,
//           caption: post.caption,
//           imageUrl: fileUrl,
//           imageId: uploadedFile.$id,
//           location: post.location,
//           tags: tags,
//         }
//       );
        
//         if(!newPost){
//             await deleteFile(uploadedFile.$id);
//             throw Error;
//         }
//             return newPost;
     

//     } catch (error) {
//         console.log(error);
        
//     }
// }

export async function createPost(post: INewPost) {
    try {
        // Upload image to storage
        const uploadedFile = await uploadFile(post.file[0]);

        if (!uploadedFile) throw new Error("File upload failed");

        // Get file Url
        const fileUrl = await getFilePreview(uploadedFile.$id);

        if (!fileUrl) {
            await deleteFile(uploadedFile.$id);
            throw new Error("Failed to get file URL");
        }

        // Check if fileUrl is a valid string URL
        if (typeof fileUrl !== "string") {
            throw new Error("File URL is not a valid string");
        }

        // Check if fileUrl length exceeds limit
        if (fileUrl.length > 2000) {
            throw new Error("File URL exceeds length limit");
        }

        // Convert tags into array
        const tags = post.tags ? post.tags.replace(/ /g, "").split(",") : [];

        // Save new post into database
        const newPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageId: uploadedFile.$id,
                location: post.location,
                tags: tags,
            }
        );

        if (!newPost) {
            await deleteFile(uploadedFile.$id);
            throw new Error("Failed to create new post in database");
        }

        return newPost;
    } catch (error) {
        console.error(error);
        throw error; // Re-throw the error to be caught by the caller
    }
}

export async function uploadFile(file:File){
    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            file
        )
        return uploadedFile;
    } catch (error) {
        console.log(error);
        
    }
}
// export async function getFilePreview(fileId:string){
//     try {
//        const fileUrl = storage.getFilePreview(
//         appwriteConfig.storageId,
//         fileId,
//         2000,
//         2000,
//         ImageGravity.Top,
//         100,
//        )

//        if(!fileUrl) throw Error;
//        console.log("fileUrl object:", fileUrl);
//        return fileUrl.href;
//     } catch (error) {
//         console.log(error);
        
//     }
// }

export function getFilePreview(fileId: string) {
    try {
        const fileUrlObject = storage.getFilePreview(
            appwriteConfig.storageId,
            fileId,
            2000,
            2000,
            ImageGravity.Top,
            100
        );

        if (!fileUrlObject || !fileUrlObject.href) {
            throw new Error("Failed to get file URL");
        }

        const fileUrl = fileUrlObject.href;

        if (typeof fileUrl !== "string" || fileUrl.length > 2000) {
            throw new Error("File URL has invalid format or exceeds length limit");
        }

        console.log("File URL:", fileUrl);
        return fileUrl;
    } catch (error) {
        console.error(error);
        throw error; // Re-throw the error to be caught by the caller
    }
}

export async function deleteFile(fileId:string){
    try {
        await storage.deleteFile(appwriteConfig.storageId,fileId);

        return {status: "ok"};
    } catch (error) {
        console.log(error);
        
    }
}


//===================get Posts =====================////

export async function getRecentPost() {
    const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.postCollectionId,
        [Query.orderDesc("$createdAt"), Query.limit(20)]
    )

    if(!posts) throw Error;

    return posts;
}

export async function LikePost(postId:string, likesArray:string[]){
    try {
      const updatedPost = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.postCollectionId,
        postId,
        {
           likes: likesArray 
        }
      ) 
      if(!updatedPost) throw Error;
      return updatedPost;
    } catch (error) {
        console.log(error);
        
    }
}
export async function SavedPost(postId:string, userId:string){
    try {
      const updatedPost = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.savesCollectionId,
        ID.unique(),
        {
           user : userId,
           post: postId
        }
      ) 
      if(!updatedPost) throw Error;
      return updatedPost;
    } catch (error) {
        console.log(error);
        
    }
}
export async function deleteSavedPost(savedRecordId:string){
    try {
      const statusCode = await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.savesCollectionId,
        savedRecordId
      ) 
      if(!statusCode) throw Error;
      return {status:"ok"};
    } catch (error) {
        console.log(error);
        
    }
}

///===================get post===================/////

export async function getPostById(postId:string) {
    try {
        const post = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId
        )
        return post;
    } catch (error) {
        console.log(error);
        
    }
}