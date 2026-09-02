import { defineRbac, presets } from "@blawness/admin-kit/rbac";

const editorLetterScope = [
  "letters.read",
  "letters.write",
  "letters.submit",
] as const;

export const rbac = defineRbac({
  roles: {
    ...presets.adminEditor,
    editor: [...presets.adminEditor.editor, ...editorLetterScope],
    // Akun pejabat penanda tangan: cukup melihat dan mengesahkan surat.
    penandatangan: ["letters.read", "letters.issue", "profile.edit"],
  },
  fallbackRole: "editor",
  protectedPermission: "users.delete",
});
