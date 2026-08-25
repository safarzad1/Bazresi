"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./OrganizationStructure.module.css";

type OrganizationNode = {
  NodeId: string;
  ParentId: string | null;
  Title: string;
  Level: number | null;
  MahalId: number | null;
  MahalTitle: string | null;
  TypeSemat: number | null;
  AssignedUserCount: number;
  AssignedUsers: string | null;
};

type TreeNode = OrganizationNode & { children: TreeNode[] };

type IconName =
  | "organization"
  | "search"
  | "refresh"
  | "expand"
  | "collapse"
  | "chevron"
  | "position"
  | "users";

function Icon({ name }: { name: IconName }) {
  const paths = {
    organization: <><rect x="9" y="3" width="6" height="5" rx="1.5" /><rect x="3" y="16" width="6" height="5" rx="1.5" /><rect x="15" y="16" width="6" height="5" rx="1.5" /><path d="M12 8v4M6 16v-4h12v4" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M18.5 16a8 8 0 1 1 1.2-7.8L20 12" /></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /><path d="m3 8 6-6M21 8l-6-6M3 16l6 6M21 16l-6 6" /></>,
    collapse: <><path d="M9 9H4V4M15 9h5V4M9 15H4v5M15 15h5v5" /><path d="m4 4 6 6M20 4l-6 6M4 20l6-6M20 20l-6-6" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    position: <><rect x="5" y="4" width="14" height="16" rx="3" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1a4.8 4.8 0 0 1 4.8-4.8h1.4a4.8 4.8 0 0 1 4.8 4.8v1M16 6a3 3 0 0 1 0 5.5M17 14a4.3 4.3 0 0 1 4 4.3V19" /></>,
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fa-IR")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ|ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTree(nodes: OrganizationNode[]) {
  const nodeMap = new Map<string, TreeNode>();
  for (const node of nodes) {
    if (!nodeMap.has(node.NodeId)) nodeMap.set(node.NodeId, { ...node, children: [] });
  }

  function createsCycle(nodeId: string, parentId: string) {
    const visited = new Set<string>([nodeId]);
    let currentId: string | null = parentId;
    while (currentId) {
      if (visited.has(currentId)) return true;
      visited.add(currentId);
      currentId = nodeMap.get(currentId)?.ParentId ?? null;
    }
    return false;
  }

  const roots: TreeNode[] = [];
  for (const node of nodeMap.values()) {
    const parent = node.ParentId ? nodeMap.get(node.ParentId) : null;
    if (parent && !createsCycle(node.NodeId, parent.NodeId)) parent.children.push(node);
    else roots.push(node);
  }

  const collator = new Intl.Collator("fa-IR");
  function sortBranch(branch: TreeNode[]) {
    branch.sort((first, second) => collator.compare(first.Title, second.Title));
    branch.forEach((node) => sortBranch(node.children));
  }
  sortBranch(roots);

  return { roots, nodeMap };
}

function TreeItem({
  node,
  expanded,
  visibleIds,
  onToggle,
}: {
  node: TreeNode;
  expanded: Set<string>;
  visibleIds: Set<string> | null;
  onToggle: (nodeId: string) => void;
}) {
  const children = visibleIds
    ? node.children.filter((child) => visibleIds.has(child.NodeId))
    : node.children;
  const hasChildren = children.length > 0;
  const isOpen = hasChildren && expanded.has(node.NodeId);

  return (
    <li className={styles.treeItem}>
      <div className={styles.nodeCard}>
        <button
          className={`${styles.toggleButton} ${isOpen ? styles.toggleOpen : ""}`}
          type="button"
          onClick={() => hasChildren && onToggle(node.NodeId)}
          disabled={!hasChildren}
          aria-label={isOpen ? `بستن شاخه ${node.Title}` : `بازکردن شاخه ${node.Title}`}
          aria-expanded={hasChildren ? isOpen : undefined}
        >
          <Icon name="chevron" />
        </button>
        <span className={styles.nodeIcon}><Icon name="position" /></span>
        <div className={styles.nodeMain}>
          <strong>{node.Title}</strong>
          <span>
            کد سمت: <b>{node.NodeId}</b>
            {node.MahalTitle ? <><i />{node.MahalTitle}</> : null}
          </span>
        </div>
        <div className={styles.nodeMeta}>
          {hasChildren && <span className={styles.childBadge}>{children.length.toLocaleString("fa-IR")} زیرمجموعه</span>}
          <span className={`${styles.userBadge} ${node.AssignedUserCount > 0 ? styles.userBadgeActive : ""}`} title={node.AssignedUsers || "کاربری تخصیص داده نشده است"}>
            <Icon name="users" />
            {node.AssignedUserCount > 0
              ? `${node.AssignedUserCount.toLocaleString("fa-IR")} کاربر`
              : "بدون کاربر"}
          </span>
        </div>
      </div>

      {isOpen && (
        <ul className={styles.treeBranch}>
          {children.map((child) => (
            <TreeItem
              key={child.NodeId}
              node={child}
              expanded={expanded}
              visibleIds={visibleIds}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrganizationStructureClient() {
  const [nodes, setNodes] = useState<OrganizationNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/organization-structure", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        nodes?: OrganizationNode[];
        message?: string;
      };
      if (!response.ok) throw new Error(data.message || "دریافت ساختار سازمانی انجام نشد.");
      const received = data.nodes ?? [];
      setNodes(received);
      setExpanded(new Set());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "دریافت ساختار سازمانی انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const { roots, nodeMap } = useMemo(() => buildTree(nodes), [nodes]);
  const normalizedSearch = normalize(search);
  const visibleIds = useMemo(() => {
    if (!normalizedSearch) return null;
    const visible = new Set<string>();
    for (const node of nodes) {
      const searchable = normalize(`${node.Title} ${node.NodeId} ${node.MahalTitle ?? ""} ${node.AssignedUsers ?? ""}`);
      if (!searchable.includes(normalizedSearch)) continue;
      visible.add(node.NodeId);
      let parentId = node.ParentId;
      const visited = new Set<string>();
      while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        visible.add(parentId);
        parentId = nodeMap.get(parentId)?.ParentId ?? null;
      }
    }
    return visible;
  }, [nodeMap, nodes, normalizedSearch]);

  const visibleRoots = visibleIds
    ? roots.filter((node) => visibleIds.has(node.NodeId))
    : roots;
  const effectiveExpanded = useMemo(() => {
    if (!visibleIds) return expanded;
    const next = new Set(expanded);
    for (const nodeId of visibleIds) {
      if (nodeMap.get(nodeId)?.children.length) next.add(nodeId);
    }
    return next;
  }, [expanded, nodeMap, visibleIds]);
  const assignedCount = nodes.reduce((sum, node) => sum + Number(node.AssignedUserCount || 0), 0);
  const maximumLevel = nodes.reduce((maximum, node) => Math.max(maximum, Number(node.Level || 0)), 0);

  function toggle(nodeId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.pageHeader}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}><Icon name="organization" /></span>
          <div>
            <span>نمایش سلسله‌مراتب سازمان</span>
            <h1>ساختار سازمانی</h1>
            <p>سمت‌ها، زیرمجموعه‌ها، محل خدمت و کاربران تخصیص‌یافته</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => setExpanded(new Set(nodes.map((node) => node.NodeId)))} disabled={loading || nodes.length === 0}><Icon name="expand" /> بازکردن همه</button>
          <button type="button" onClick={() => setExpanded(new Set())} disabled={loading || nodes.length === 0}><Icon name="collapse" /> بستن همه</button>
          <button className={styles.refreshButton} type="button" onClick={() => void load()} disabled={loading}><Icon name="refresh" /> به‌روزرسانی</button>
        </div>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchBox}>
          <Icon name="search" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجوی سمت، کد، محل یا نام کاربر..." />
        </label>
        <div className={styles.summary}>
          <span><b>{nodes.length.toLocaleString("fa-IR")}</b> سمت</span>
          <span><b>{maximumLevel.toLocaleString("fa-IR")}</b> سطح</span>
          <span><b>{assignedCount.toLocaleString("fa-IR")}</b> تخصیص کاربر</span>
        </div>
      </section>

      <section className={styles.treeCard}>
        <header className={styles.treeHeader}>
          <div><strong>درخت سازمان</strong><small>{normalizedSearch ? `${visibleIds?.size ?? 0} نتیجه مرتبط` : `${roots.length} شاخه اصلی`}</small></div>
          <span>برای مشاهده زیرمجموعه روی پیکان هر گره کلیک کنید</span>
        </header>

        {loading ? (
          <div className={styles.stateBox}><span className={styles.spinner} />در حال دریافت ساختار سازمانی...</div>
        ) : error ? (
          <div className={`${styles.stateBox} ${styles.errorState}`}><strong>{error}</strong><button type="button" onClick={() => void load()}>تلاش دوباره</button></div>
        ) : visibleRoots.length === 0 ? (
          <div className={styles.stateBox}><Icon name="organization" /><strong>موردی پیدا نشد</strong><span>عبارت جست‌وجو را تغییر دهید.</span></div>
        ) : (
          <div className={styles.treeScroll}>
            <ul className={styles.treeRoot}>
              {visibleRoots.map((node) => (
                <TreeItem key={node.NodeId} node={node} expanded={effectiveExpanded} visibleIds={visibleIds} onToggle={toggle} />
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
