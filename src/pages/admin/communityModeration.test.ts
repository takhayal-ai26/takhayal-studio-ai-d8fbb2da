import { describe, expect, it, vi } from "vitest";
import {
  approveCommunityPost,
  rejectCommunityPost,
  restoreCommunityPost,
  toggleCommunityPostFeatured,
  validateManualCommunityPost,
} from "./communityModeration";

function createCommunityClient(error: unknown = null) {
  const updates: Array<{ table: string; payload: Record<string, unknown>; eq?: { column: string; value: string } }> = [];

  const client = {
    from(table: string) {
      return {
        update(payload: Record<string, unknown>) {
          const call: { table: string; payload: Record<string, unknown>; eq?: { column: string; value: string } } = { table, payload };
          updates.push(call);
          return {
            eq(column: string, value: string) {
              call.eq = { column, value };
              return Promise.resolve({ error });
            },
          };
        },
      };
    },
  };

  return { client, updates };
}

function createToast() {
  return {
    success: vi.fn(),
    error: vi.fn(),
  };
}

describe("community moderation helpers", () => {
  const now = new Date("2026-05-06T12:00:00.000Z");

  it("approves posts with the expected moderation payload", async () => {
    const { client, updates } = createCommunityClient();

    await approveCommunityPost({
      client,
      postId: "post-1",
      actor: "Admin",
      now,
      toast: createToast(),
      refetch: vi.fn(),
    });

    expect(updates).toEqual([
      {
        table: "community_posts",
        payload: {
          status: "approved",
          approved_at: now.toISOString(),
          approved_by: "Admin",
          rejection_reason: null,
          rejected_at: null,
          rejected_by: null,
        },
        eq: { column: "id", value: "post-1" },
      },
    ]);
  });

  it("rejects posts with the expected moderation payload", async () => {
    const { client, updates } = createCommunityClient();

    await rejectCommunityPost({
      client,
      postId: "post-2",
      actor: "Moderator",
      reason: "Low quality",
      now,
      toast: createToast(),
      refetch: vi.fn(),
    });

    expect(updates[0].payload).toEqual({
      status: "rejected",
      rejected_at: now.toISOString(),
      rejected_by: "Moderator",
      rejection_reason: "Low quality",
      approved_at: null,
      approved_by: null,
    });
    expect(updates[0].eq).toEqual({ column: "id", value: "post-2" });
  });

  it("restores posts with the expected moderation payload", async () => {
    const { client, updates } = createCommunityClient();

    await restoreCommunityPost({
      client,
      postId: "post-3",
      toast: createToast(),
      refetch: vi.fn(),
    });

    expect(updates[0].payload).toEqual({
      status: "pending",
      rejection_reason: null,
      rejected_at: null,
      rejected_by: null,
      approved_at: null,
      approved_by: null,
    });
  });

  it("requires manual community posts to include an image", () => {
    expect(validateManualCommunityPost({ file: null, imageUrl: "" })).toBe("Please provide an image");
    expect(validateManualCommunityPost({ file: null, imageUrl: "   " })).toBe("Please provide an image");
    expect(validateManualCommunityPost({ file: new File(["image"], "post.png"), imageUrl: "" })).toBeNull();
    expect(validateManualCommunityPost({ file: null, imageUrl: "https://cdn.test/post.png" })).toBeNull();
  });

  it("refetches after successfully toggling featured state", async () => {
    const { client, updates } = createCommunityClient();
    const toast = createToast();
    const refetch = vi.fn();

    await toggleCommunityPostFeatured({
      client,
      post: { id: "post-4", is_featured: false },
      toast,
      refetch,
    });

    expect(updates[0].payload).toEqual({ is_featured: true });
    expect(toast.success).toHaveBeenCalledWith("Featured");
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast and skips refetch when a Supabase update fails", async () => {
    const { client } = createCommunityClient(new Error("offline"));
    const toast = createToast();
    const refetch = vi.fn();

    const result = await toggleCommunityPostFeatured({
      client,
      post: { id: "post-5", is_featured: true },
      toast,
      refetch,
    });

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to update featured status");
    expect(toast.success).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });
});
