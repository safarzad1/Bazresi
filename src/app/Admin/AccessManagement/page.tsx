"use client";

import {
    Check,
    KeyRound,
    Pencil,
    Plus,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    UserRoundCog,
    UsersRound,
    X,
} from "lucide-react";
import {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import ConfirmYesNo from "@/component/ConfirmModal/ConfirmYesNo";
import {
    SearchableDropdown,
    type DropdownOption,
} from "@/component/Dropdown";

import styles from "./AccessManagement.module.css";

type TabId = "permissions" | "users" | "groups";

type GroupRow = {
    GroupId: number;
    GroupTitle: string;
    UserCount: number;
    AccessCount: number;
    IsSystem: boolean;
};

type UserGroupRow = {
    UserId: string;
    UserName: string;
    DisplayName: string;
    IsSystemAdmin: boolean;
    IsActive: boolean;
    GroupId: number | null;
    GroupTitle: string | null;
};

type MenuAccessRow = {
    MenuId: number;
    MenuCode: string;
    MenuTitle: string;
    MenuRoute: string;
    MenuSection: string;
    SortOrder: number;
    IsAllowed: boolean;
};

type GroupForm = {
    groupId: number | null;
    groupTitle: string;
};

const tabs: Array<{
    id: TabId;
    title: string;
    icon: typeof ShieldCheck;
}> = [
    { id: "permissions", title: "دسترسی گروه‌ها", icon: ShieldCheck },
    { id: "users", title: "مدیریت کاربران و گروه‌ها", icon: UserRoundCog },
    { id: "groups", title: "گروه‌ها", icon: UsersRound },
];

export default function AccessManagementPage() {
    const [tab, setTab] = useState<TabId>("permissions");
    const [groups, setGroups] = useState<GroupRow[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

    const [permissions, setPermissions] = useState<MenuAccessRow[]>([]);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [permissionsSaving, setPermissionsSaving] = useState(false);

    const [users, setUsers] = useState<UserGroupRow[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [savingUserId, setSavingUserId] = useState<string | null>(null);

    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [groupForm, setGroupForm] = useState<GroupForm>({
        groupId: null,
        groupTitle: "",
    });
    const [groupSaving, setGroupSaving] = useState(false);
    const [deleteGroup, setDeleteGroup] = useState<GroupRow | null>(null);
    const [groupDeleting, setGroupDeleting] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const groupOptions = useMemo<DropdownOption<number>[]>(
        () =>
            groups.map((group) => ({
                value: Number(group.GroupId),
                label: group.GroupTitle,
                description: `شماره گروه ${Number(group.GroupId).toLocaleString("fa-IR")}`,
                searchText: `${group.GroupId} ${group.GroupTitle}`,
            })),
        [groups],
    );

    const selectedGroup = useMemo(
        () => groups.find((group) => group.GroupId === selectedGroupId) ?? null,
        [groups, selectedGroupId],
    );

    const selectedGroupIsFullAccess = selectedGroup?.GroupTitle === "دسترسی کامل";

    const groupedPermissions = useMemo(() => {
        const map = new Map<string, MenuAccessRow[]>();
        for (const item of permissions) {
            const section = item.MenuSection || "سایر";
            const list = map.get(section) ?? [];
            list.push(item);
            map.set(section, list);
        }
        return Array.from(map.entries());
    }, [permissions]);

    const allowedCount = useMemo(
        () => permissions.filter((item) => item.IsAllowed).length,
        [permissions],
    );

    const loadGroups = useCallback(async (preferGroupId?: number | null) => {
        try {
            setGroupsLoading(true);
            const response = await fetch("/api/access-management?view=groups", {
                cache: "no-store",
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "دریافت گروه‌ها انجام نشد.");
            }

            const rows = (data.items ?? []) as GroupRow[];
            setGroups(rows);
            setSelectedGroupId((current) => {
                const desired = preferGroupId ?? current;
                if (desired && rows.some((row) => Number(row.GroupId) === desired)) {
                    return desired;
                }
                return rows[0] ? Number(rows[0].GroupId) : null;
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "خطا در دریافت گروه‌ها.");
        } finally {
            setGroupsLoading(false);
        }
    }, []);

    const loadPermissions = useCallback(async (groupId: number) => {
        try {
            setPermissionsLoading(true);
            setError("");
            const response = await fetch(
                `/api/access-management?view=permissions&groupId=${groupId}`,
                { cache: "no-store" },
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "دریافت دسترسی‌ها انجام نشد.");
            }
            setPermissions(
                ((data.items ?? []) as MenuAccessRow[]).map((item) => ({
                    ...item,
                    MenuId: Number(item.MenuId),
                    SortOrder: Number(item.SortOrder ?? 0),
                    IsAllowed: Boolean(item.IsAllowed),
                })),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "خطا در دریافت دسترسی‌ها.");
        } finally {
            setPermissionsLoading(false);
        }
    }, []);

    const loadUsers = useCallback(async (search: string) => {
        try {
            setUsersLoading(true);
            setError("");
            const params = new URLSearchParams({
                view: "users",
                search,
            });
            const response = await fetch(`/api/access-management?${params.toString()}`, {
                cache: "no-store",
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "دریافت کاربران انجام نشد.");
            }
            setUsers((data.items ?? []) as UserGroupRow[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "خطا در دریافت کاربران.");
        } finally {
            setUsersLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadGroups();
    }, [loadGroups]);

    useEffect(() => {
        if (tab !== "permissions" || !selectedGroupId) return;
        void loadPermissions(selectedGroupId);
    }, [tab, selectedGroupId, loadPermissions]);

    useEffect(() => {
        if (tab !== "users") return;
        const timer = window.setTimeout(() => void loadUsers(userSearch.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [tab, userSearch, loadUsers]);

    function clearStatus() {
        setMessage("");
        setError("");
    }

    function openCreateGroup() {
        clearStatus();
        setGroupForm({ groupId: null, groupTitle: "" });
        setGroupModalOpen(true);
    }

    function openEditGroup(group: GroupRow) {
        clearStatus();
        setGroupForm({
            groupId: Number(group.GroupId),
            groupTitle: group.GroupTitle,
        });
        setGroupModalOpen(true);
    }

    async function saveGroup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const title = groupForm.groupTitle.trim();
        if (!title) {
            setError("عنوان گروه الزامی است.");
            return;
        }

        try {
            setGroupSaving(true);
            setError("");
            const response = await fetch("/api/access-management", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "save_group",
                    groupId: groupForm.groupId,
                    groupTitle: title,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || "ذخیره گروه انجام نشد.");

            const savedId = Number(data?.item?.GroupId || groupForm.groupId || 0) || null;
            setGroupModalOpen(false);
            setMessage(groupForm.groupId ? "عنوان گروه ویرایش شد." : "گروه جدید ثبت شد.");
            await loadGroups(savedId);
            if (savedId) setSelectedGroupId(savedId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "خطا در ذخیره گروه.");
        } finally {
            setGroupSaving(false);
        }
    }

    async function confirmDeleteGroup() {
        if (!deleteGroup || groupDeleting) return;
        try {
            setGroupDeleting(true);
            setError("");
            const response = await fetch("/api/access-management", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId: deleteGroup.GroupId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || "حذف گروه انجام نشد.");

            setDeleteGroup(null);
            setMessage("گروه حذف شد.");
            await loadGroups();
        } catch (err) {
            setError(err instanceof Error ? err.message : "خطا در حذف گروه.");
        } finally {
            setGroupDeleting(false);
        }
    }

    function togglePermission(menuId: number) {
        if (selectedGroupIsFullAccess) return;
        setPermissions((current) =>
            current.map((item) =>
                item.MenuId === menuId
                    ? { ...item, IsAllowed: !item.IsAllowed }
                    : item,
            ),
        );
    }

    function setAllPermissions(value: boolean) {
        if (selectedGroupIsFullAccess) return;
        setPermissions((current) =>
            current.map((item) => ({ ...item, IsAllowed: value })),
        );
    }

    async function savePermissions() {
        if (!selectedGroupId || permissionsSaving || selectedGroupIsFullAccess) return;
        try {
            setPermissionsSaving(true);
            setError("");
            const response = await fetch("/api/access-management", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "save_group_access",
                    groupId: selectedGroupId,
                    accesses: permissions.map((item) => ({
                        menuId: item.MenuId,
                        isAllowed: item.IsAllowed,
                    })),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "ذخیره دسترسی‌ها انجام نشد.");
            }
            setPermissions(
                ((data.items ?? []) as MenuAccessRow[]).map((item) => ({
                    ...item,
                    IsAllowed: Boolean(item.IsAllowed),
                })),
            );
            setMessage("دسترسی‌های گروه ذخیره شد.");
            await loadGroups(selectedGroupId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "خطا در ذخیره دسترسی‌ها.");
        } finally {
            setPermissionsSaving(false);
        }
    }

    async function setUserGroup(user: UserGroupRow, groupId: number) {
        if (savingUserId !== null) return;
        const oldGroupId = user.GroupId;
        const oldGroupTitle = user.GroupTitle;
        setUsers((current) =>
            current.map((row) =>
                row.UserId === user.UserId
                    ? {
                          ...row,
                          GroupId: groupId,
                          GroupTitle:
                              groups.find((group) => group.GroupId === groupId)?.GroupTitle ?? null,
                      }
                    : row,
            ),
        );

        try {
            setSavingUserId(user.UserId);
            setError("");
            const response = await fetch("/api/access-management", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "set_user_group",
                    userId: user.UserId,
                    groupId,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || "تغییر گروه کاربر انجام نشد.");
            setMessage(`گروه کاربر «${user.DisplayName}» تغییر کرد.`);
            await loadGroups(selectedGroupId);
        } catch (err) {
            setUsers((current) =>
                current.map((row) =>
                    row.UserId === user.UserId
                        ? { ...row, GroupId: oldGroupId, GroupTitle: oldGroupTitle }
                        : row,
                ),
            );
            setError(err instanceof Error ? err.message : "خطا در تغییر گروه کاربر.");
        } finally {
            setSavingUserId(null);
        }
    }

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerLead}>
                    <span className={styles.headerIcon}>
                        <ShieldCheck size={22} />
                    </span>
                    <div>
                        <span className={styles.eyebrow}>امنیت و سطح دسترسی</span>
                        <h1>مدیریت دسترسی</h1>
                        <p>
                            دسترسی فرم‌های سامانه بر اساس گروه کاربر کنترل می‌شود. هر کاربر یک گروه دارد و
                            مجوز مشاهده بخش‌ها از دسترسی‌های همان گروه تعیین می‌شود.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    className={styles.refreshButton}
                    onClick={() => {
                        clearStatus();
                        void loadGroups(selectedGroupId);
                        if (tab === "permissions" && selectedGroupId) {
                            void loadPermissions(selectedGroupId);
                        }
                        if (tab === "users") void loadUsers(userSearch.trim());
                    }}
                >
                    <RefreshCw size={16} />
                    بازخوانی
                </button>
            </header>

            <div className={styles.tabs} role="tablist" aria-label="بخش‌های مدیریت دسترسی">
                {tabs.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={tab === item.id}
                            className={`${styles.tab} ${tab === item.id ? styles.tabActive : ""}`}
                            onClick={() => {
                                clearStatus();
                                setTab(item.id);
                            }}
                        >
                            <Icon size={17} />
                            {item.title}
                        </button>
                    );
                })}
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}
            {message ? <div className={styles.success}>{message}</div> : null}

            {tab === "permissions" ? (
                <section className={styles.panel}>
                    <div className={styles.panelToolbar}>
                        <div className={styles.groupPicker}>
                            <label>گروه</label>
                            <SearchableDropdown
                                value={selectedGroupId}
                                options={groupOptions}
                                onChange={(value) => {
                                    clearStatus();
                                    setSelectedGroupId(Number(value));
                                }}
                                placeholder="گروه را انتخاب کنید"
                                loading={groupsLoading}
                                compact
                                leadingIcon={<UsersRound size={16} />}
                            />
                        </div>

                        <div className={styles.permissionSummary}>
                            <span>
                                <ShieldCheck size={16} />
                                {selectedGroup?.GroupTitle || "بدون گروه"}
                            </span>
                            <small>
                                {allowedCount.toLocaleString("fa-IR")} از {permissions.length.toLocaleString("fa-IR")} فرم مجاز
                            </small>
                        </div>

                        <div className={styles.toolbarActions}>
                            <button type="button" onClick={() => setAllPermissions(true)} disabled={!permissions.length || selectedGroupIsFullAccess}>
                                <Check size={15} /> انتخاب همه
                            </button>
                            <button type="button" onClick={() => setAllPermissions(false)} disabled={!permissions.length || selectedGroupIsFullAccess}>
                                <X size={15} /> حذف همه
                            </button>
                            <button
                                type="button"
                                className={styles.primaryButton}
                                onClick={() => void savePermissions()}
                                disabled={!selectedGroupId || permissionsLoading || permissionsSaving || selectedGroupIsFullAccess}
                            >
                                <Save size={16} />
                                {permissionsSaving ? "در حال ذخیره..." : "ذخیره دسترسی‌ها"}
                            </button>
                        </div>
                    </div>

                    {selectedGroupIsFullAccess ? (
                        <p className={styles.exclusionNote}>
                            گروه «دسترسی کامل» سیستمی است و برای جلوگیری از قفل‌شدن مدیریت سامانه، همه دسترسی‌های آن همیشه فعال می‌ماند.
                        </p>
                    ) : null}

                    {permissionsLoading ? (
                        <div className={styles.loading}>در حال دریافت دسترسی‌های گروه...</div>
                    ) : !selectedGroupId ? (
                        <div className={styles.empty}>ابتدا یک گروه ایجاد یا انتخاب کنید.</div>
                    ) : (
                        <div className={styles.permissionSections}>
                            {groupedPermissions.map(([section, items]) => (
                                <div key={section} className={styles.permissionSection}>
                                    <div className={styles.sectionTitle}>{section}</div>
                                    <div className={styles.permissionGrid}>
                                        {items.map((item) => (
                                            <button
                                                key={item.MenuId}
                                                type="button"
                                                className={`${styles.permissionCard} ${
                                                    item.IsAllowed ? styles.permissionCardAllowed : ""
                                                }`}
                                                onClick={() => togglePermission(item.MenuId)}
                                                disabled={selectedGroupIsFullAccess}
                                                title={selectedGroupIsFullAccess ? "گروه دسترسی کامل همیشه به همه بخش‌ها دسترسی دارد" : undefined}
                                            >
                                                <span className={styles.permissionCheck}>
                                                    {item.IsAllowed ? <Check size={14} /> : null}
                                                </span>
                                                <span className={styles.permissionText}>
                                                    <strong>{item.MenuTitle}</strong>
                                                    <small>{item.MenuRoute}</small>
                                                </span>
                                                <span className={styles.permissionState}>
                                                    {item.IsAllowed ? "دسترسی دارد" : "دسترسی ندارد"}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            ) : null}

            {tab === "users" ? (
                <section className={styles.panel}>
                    <div className={styles.listToolbar}>
                        <div className={styles.searchBox}>
                            <Search size={16} />
                            <input
                                value={userSearch}
                                onChange={(event) => setUserSearch(event.target.value)}
                                placeholder="جستجو در نام، نام کاربری یا گروه..."
                            />
                        </div>
                        <div className={styles.infoPill}>
                            <KeyRound size={15} /> هر کاربر فقط یک گروه دسترسی دارد
                        </div>
                    </div>

                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>وضعیت</th>
                                    <th>کاربر</th>
                                    <th>نام کاربری</th>
                                    <th>گروه دسترسی</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersLoading ? (
                                    <tr><td colSpan={4} className={styles.tableMessage}>در حال دریافت کاربران...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={4} className={styles.tableMessage}>کاربری برای مدیریت گروه وجود ندارد.</td></tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.UserId}>
                                            <td><span className={user.IsActive ? styles.activeUser : styles.inactiveUser}>{user.IsActive ? "فعال" : "غیرفعال"}</span></td>
                                            <td>
                                                <div className={styles.userCell}>
                                                    <span className={styles.userAvatar}>
                                                        {(user.DisplayName || user.UserName).trim().slice(0, 1)}
                                                    </span>
                                                    <span>
                                                        {user.DisplayName}
                                                        {user.IsSystemAdmin ? <small>مدیر سیستم</small> : null}
                                                    </span>
                                                </div>
                                            </td>
                                            <td dir="ltr" className={styles.userNameCell}>{user.UserName}</td>
                                            <td className={styles.groupCell}>
                                                <SearchableDropdown
                                                    value={user.GroupId == null ? null : Number(user.GroupId)}
                                                    options={groupOptions}
                                                    onChange={(value) => void setUserGroup(user, Number(value))}
                                                    placeholder="انتخاب گروه"
                                                    compact
                                                    disabled={savingUserId === user.UserId}
                                                    loading={savingUserId === user.UserId}
                                                    leadingIcon={<UsersRound size={15} />}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className={styles.exclusionNote}>
                        تغییر گروه و دسترسی‌ها از درخواست بعدی کاربر اعمال می‌شود؛ معمولاً نیازی به خروج و ورود مجدد نیست. مدیران سیستم مستقل از گروه، دسترسی کامل دارند.
                    </p>
                </section>
            ) : null}

            {tab === "groups" ? (
                <section className={styles.panel}>
                    <div className={styles.listToolbar}>
                        <div className={styles.infoPill}>
                            <UsersRound size={15} /> {groups.length.toLocaleString("fa-IR")} گروه تعریف شده
                        </div>
                        <button type="button" className={styles.primaryButton} onClick={openCreateGroup}>
                            <Plus size={16} /> گروه جدید
                        </button>
                    </div>

                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>شماره گروه</th>
                                    <th>عنوان گروه</th>
                                    <th>تعداد کاربران</th>
                                    <th>دسترسی‌های فعال</th>
                                    <th className={styles.actionHeader}>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupsLoading ? (
                                    <tr><td colSpan={5} className={styles.tableMessage}>در حال دریافت گروه‌ها...</td></tr>
                                ) : groups.length === 0 ? (
                                    <tr><td colSpan={5} className={styles.tableMessage}>گروهی تعریف نشده است.</td></tr>
                                ) : (
                                    groups.map((group) => (
                                        <tr key={group.GroupId}>
                                            <td>{Number(group.GroupId).toLocaleString("fa-IR")}</td>
                                            <td>{group.GroupTitle}</td>
                                            <td>{Number(group.UserCount || 0).toLocaleString("fa-IR")}</td>
                                            <td>{Number(group.AccessCount || 0).toLocaleString("fa-IR")}</td>
                                            <td>
                                                <div className={styles.rowActions}>
                                                    <button type="button" onClick={() => openEditGroup(group)} disabled={Boolean(group.IsSystem)} title={group.IsSystem ? "عنوان گروه سیستمی ثابت است" : "ویرایش"}>
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles.deleteButton}
                                                        onClick={() => setDeleteGroup(group)}
                                                        disabled={Boolean(group.IsSystem)}
                                                        title={group.IsSystem ? "گروه سیستمی قابل حذف نیست" : "حذف"}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            {groupModalOpen ? (
                <div className={styles.modalRoot} role="dialog" aria-modal="true">
                    <button
                        type="button"
                        className={styles.modalBackdrop}
                        aria-label="بستن"
                        onClick={() => !groupSaving && setGroupModalOpen(false)}
                    />
                    <form className={styles.modalCard} onSubmit={saveGroup}>
                        <div className={styles.modalHeader}>
                            <div>
                                <span>{groupForm.groupId ? "ویرایش گروه" : "گروه جدید"}</span>
                                <strong>تعریف گروه دسترسی</strong>
                            </div>
                            <button type="button" onClick={() => setGroupModalOpen(false)} disabled={groupSaving}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {groupForm.groupId ? (
                                <div className={styles.readOnlyId}>
                                    شماره گروه: {groupForm.groupId.toLocaleString("fa-IR")}
                                </div>
                            ) : null}
                            <label className={styles.field}>
                                <span>عنوان گروه</span>
                                <input
                                    autoFocus
                                    maxLength={150}
                                    value={groupForm.groupTitle}
                                    onChange={(event) =>
                                        setGroupForm((current) => ({
                                            ...current,
                                            groupTitle: event.target.value,
                                        }))
                                    }
                                    placeholder="مثلاً مسئول واحد موتوری"
                                />
                            </label>
                        </div>
                        <div className={styles.modalFooter}>
                            <button type="button" onClick={() => setGroupModalOpen(false)} disabled={groupSaving}>
                                انصراف
                            </button>
                            <button type="submit" className={styles.primaryButton} disabled={groupSaving}>
                                <Save size={16} />
                                {groupSaving ? "در حال ذخیره..." : "ذخیره گروه"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            <ConfirmYesNo
                isOpen={Boolean(deleteGroup)}
                header="حذف گروه دسترسی"
                type="warning"
                message={
                    deleteGroup
                        ? `گروه «${deleteGroup.GroupTitle}» حذف شود؟ اگر کاربری عضو این گروه باشد، حذف انجام نخواهد شد.`
                        : ""
                }
                onCancel={() => !groupDeleting && setDeleteGroup(null)}
                onConfirm={() => void confirmDeleteGroup()}
            />
        </main>
    );
}
