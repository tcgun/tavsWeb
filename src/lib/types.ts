export interface User {
    uid: string;
    username: string;
    email: string;
    displayName: string;
    photoURL?: string;
    bio?: string;
    stats: {
        followers: number;
        following: number;
    };
    createdAt: string;
}

export interface Location {
    lat: number;
    lng: number;
    address?: string;
}

export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorPhotoURL?: string;
    title: string;
    detail: string;
    imageUrl?: string;
    category: string;
    location?: Location;
    likesCount: number;
    commentsCount: number;
    savesCount: number;
    createdAt: string;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    username: string;
    userPhotoURL?: string;
    text: string;
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string; // Receiver
    type: 'like' | 'comment' | 'follow';
    sourceId: string; // Post ID or User ID
    sourceName: string; // User who triggered the notification
    sourcePhotoURL?: string;
    read: boolean;
    createdAt: string;
}
