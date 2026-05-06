export type CommunityPostUpdatePayload = Record<string, string | boolean | null>;

export type CommunityPostMutationClient = {
  from(table: string): {
    update(payload: CommunityPostUpdatePayload): {
      eq(column: string, value: string): PromiseLike<{ error: unknown | null }>;
    };
  };
};

export type CommunityToast = {
  success(message: string): void;
  error(message: string): void;
};

export type CommunityPostModerationTarget = {
  id: string;
  is_featured: boolean;
};

type RefetchPosts = () => void | Promise<void>;

type CommunityMutationOptions = {
  client: CommunityPostMutationClient;
  postId: string;
  payload: CommunityPostUpdatePayload;
  successMessage: string;
  errorMessage: string;
  toast: CommunityToast;
  refetch: RefetchPosts;
};

type ModeratorMutationOptions = {
  client: CommunityPostMutationClient;
  postId: string;
  actor?: string | null;
  now?: Date;
  toast: CommunityToast;
  refetch: RefetchPosts;
};

type RejectMutationOptions = ModeratorMutationOptions & {
  reason?: string;
};

export function buildApproveCommunityPostPayload(actor: string | null | undefined, now = new Date()): CommunityPostUpdatePayload {
  return {
    status: "approved",
    approved_at: now.toISOString(),
    approved_by: actor || "admin",
    rejection_reason: null,
    rejected_at: null,
    rejected_by: null,
  };
}

export function buildRejectCommunityPostPayload(
  actor: string | null | undefined,
  reason: string | undefined,
  now = new Date(),
): CommunityPostUpdatePayload {
  return {
    status: "rejected",
    rejected_at: now.toISOString(),
    rejected_by: actor || "admin",
    rejection_reason: reason || null,
    approved_at: null,
    approved_by: null,
  };
}

export function buildRestoreCommunityPostPayload(): CommunityPostUpdatePayload {
  return {
    status: "pending",
    rejection_reason: null,
    rejected_at: null,
    rejected_by: null,
    approved_at: null,
    approved_by: null,
  };
}

export function buildRemoveCommunityPostPayload(actor: string | null | undefined, now = new Date()): CommunityPostUpdatePayload {
  return {
    status: "rejected",
    rejected_at: now.toISOString(),
    rejected_by: actor || "admin",
  };
}

export function validateManualCommunityPost({ file, imageUrl }: { file: File | null; imageUrl?: string | null }): string | null {
  if (file || imageUrl?.trim()) return null;
  return "Please provide an image";
}

export async function updateCommunityPost({
  client,
  postId,
  payload,
  successMessage,
  errorMessage,
  toast,
  refetch,
}: CommunityMutationOptions): Promise<boolean> {
  try {
    const { error } = await client
      .from("community_posts")
      .update(payload)
      .eq("id", postId);

    if (error) {
      toast.error(errorMessage);
      return false;
    }

    toast.success(successMessage);
    await refetch();
    return true;
  } catch {
    toast.error(errorMessage);
    return false;
  }
}

export function approveCommunityPost({ client, postId, actor, now, toast, refetch }: ModeratorMutationOptions) {
  return updateCommunityPost({
    client,
    postId,
    payload: buildApproveCommunityPostPayload(actor, now),
    successMessage: "Approved successfully",
    errorMessage: "Failed to approve",
    toast,
    refetch,
  });
}

export function rejectCommunityPost({ client, postId, actor, reason, now, toast, refetch }: RejectMutationOptions) {
  return updateCommunityPost({
    client,
    postId,
    payload: buildRejectCommunityPostPayload(actor, reason, now),
    successMessage: "Rejected successfully",
    errorMessage: "Failed to reject",
    toast,
    refetch,
  });
}

export function restoreCommunityPost({
  client,
  postId,
  toast,
  refetch,
}: Pick<ModeratorMutationOptions, "client" | "postId" | "toast" | "refetch">) {
  return updateCommunityPost({
    client,
    postId,
    payload: buildRestoreCommunityPostPayload(),
    successMessage: "Restored to pending",
    errorMessage: "Failed to restore",
    toast,
    refetch,
  });
}

export function removeCommunityPost({ client, postId, actor, now, toast, refetch }: ModeratorMutationOptions) {
  return updateCommunityPost({
    client,
    postId,
    payload: buildRemoveCommunityPostPayload(actor, now),
    successMessage: "Removed from community",
    errorMessage: "Failed to remove from community",
    toast,
    refetch,
  });
}

export function toggleCommunityPostFeatured({
  client,
  post,
  toast,
  refetch,
}: {
  client: CommunityPostMutationClient;
  post: CommunityPostModerationTarget;
  toast: CommunityToast;
  refetch: RefetchPosts;
}) {
  return updateCommunityPost({
    client,
    postId: post.id,
    payload: { is_featured: !post.is_featured },
    successMessage: post.is_featured ? "Unfeatured" : "Featured",
    errorMessage: "Failed to update featured status",
    toast,
    refetch,
  });
}
