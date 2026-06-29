import { defineRbac, presets } from "@blawness/admin-kit/rbac";

export const rbac = defineRbac({
  roles: { ...presets.adminEditor }, // keeps the old admin/editor scopes
  fallbackRole: "editor",
  protectedPermission: "users.delete", // role(s) holding this can't all be removed
});
