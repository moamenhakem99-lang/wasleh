export const approvalLabels: Record<string, string> = { PENDING: "بانتظار المراجعة", APPROVED: "معتمدة", REJECTED: "مرفوضة", CHANGES_REQUESTED: "تحتاج تعديلات" };
export const bookingLabels: Record<string, string> = { PENDING: "بانتظار الرد", ACCEPTED: "مؤكد", REJECTED: "مرفوض", COMPLETED: "مكتمل", CANCELLED: "ملغي" };
export function shortDate(value: Date) { return new Intl.DateTimeFormat("ar-SY", { day: "numeric", month: "short", year: "numeric" }).format(value); }
