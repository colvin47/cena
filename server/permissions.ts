import type { TrpcContext } from "./_core/context";

export type AdminRole = "owner" | "moderator" | "agenda";
type UserLike = NonNullable<TrpcContext["user"]>;

export function canModerate(user: UserLike) {
  return user.role === "admin" && (user.adminRole === "owner" || user.adminRole === "moderator");
}
export function canAudit(user: UserLike) {
  return canModerate(user);
}
export function canBroadcast(user: UserLike) {
  return user.role === "admin" && (user.adminRole === "owner" || user.adminRole === "moderator" || user.adminRole === "agenda");
}
