"use client";

import UserListComponent from "@/components/profile/UserListComponent";
import { useParams } from "next/navigation";

export default function FollowersPage() {
    const params = useParams();
    const userId = params.id as string;

    return (
        <UserListComponent
            userId={userId}
            type="followers"
            title="Takipçiler"
        />
    );
}
