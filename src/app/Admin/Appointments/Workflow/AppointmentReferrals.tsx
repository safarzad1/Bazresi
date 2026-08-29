"use client";

import { useMemo, useState, type CSSProperties } from "react";
import styles from "./Workflow.module.css";

export type ReferralItem = {
  ReferralId: number;
  ParentReferralId: number | null;
  ReferralKind: number;
  FromPostId: number;
  FromPostTitle: string | null;
  FromFullName: string | null;
  ToPostId: number;
  ToPostTitle: string | null;
  ToFullName: string | null;
  Note: string | null;
  StatusCode: number;
  StatusTitle: string | null;
  IsRead: boolean;
  ReadByFullName: string | null;
  ReadDateTime: string | null;
  IsRecalled: boolean;
  RecallDateTime: string | null;
  CreateByFullName: string | null;
  CreateDateTime: string | null;
  CanReply: boolean;
  CanRecall: boolean;
  CanArchive: boolean;
  IsArchivedForActor: boolean;
};

export type ReferralPost = {
  PostId: number;
  PostTitle: string;
  ParentPostId: number | null;
  Mahal: number | null;
  AssigneeFullName: string | null;
};

export type ReferralContext = {
  ActorPostId: number;
  ActorFullName: string | null;
  ActorPostTitle: string | null;
  CanRefer: boolean;
};

type Filter = "all" | "inbox" | "sent" | "archive";

function ReferralArrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M14 7l5 5-5 5" /></svg>;
}

function computeDepth(item: ReferralItem, byId: Map<number, ReferralItem>) {
  let depth = 0;
  let parentId = item.ParentReferralId;
  const visited = new Set<number>();
  while (parentId && depth < 6 && !visited.has(parentId)) {
    visited.add(parentId);
    depth += 1;
    parentId = byId.get(parentId)?.ParentReferralId ?? null;
  }
  return depth;
}

export default function AppointmentReferrals({
  entesabId,
  referrals,
  posts,
  context,
  onChanged,
}: {
  entesabId: number;
  referrals: ReferralItem[];
  posts: ReferralPost[];
  context: ReferralContext | null;
  onChanged: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [postSearch, setPostSearch] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [forwardNote, setForwardNote] = useState("");
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyNote, setReplyNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const actorPostId = context?.ActorPostId ?? 0;
  const byId = useMemo(() => new Map(referrals.map((item) => [item.ReferralId, item])), [referrals]);
  const counts = useMemo(() => ({
    all: referrals.filter((item) => !item.IsArchivedForActor).length,
    inbox: referrals.filter((item) => item.ToPostId === actorPostId && !item.IsArchivedForActor).length,
    sent: referrals.filter((item) => item.FromPostId === actorPostId && !item.IsArchivedForActor).length,
    archive: referrals.filter((item) => item.IsArchivedForActor).length,
  }), [actorPostId, referrals]);

  const visible = useMemo(() => referrals.filter((item) => {
    if (filter === "archive") return item.IsArchivedForActor;
    if (item.IsArchivedForActor) return false;
    if (filter === "inbox") return item.ToPostId === actorPostId;
    if (filter === "sent") return item.FromPostId === actorPostId;
    return true;
  }), [actorPostId, filter, referrals]);

  const visiblePosts = useMemo(() => {
    const term = postSearch.trim().toLocaleLowerCase("fa");
    return posts.filter((item) => !term || `${item.PostTitle} ${item.AssigneeFullName || ""}`.toLocaleLowerCase("fa").includes(term));
  }, [postSearch, posts]);

  const runAction = async (action: "forward" | "reply" | "recall" | "archive" | "restore", referralId?: number) => {
    if (saving) return;
    const note = action === "forward" ? forwardNote.trim() : action === "reply" ? replyNote.trim() : null;
    if (action === "forward" && !selectedPosts.length) { setError("حداقل یک گیرنده را انتخاب کنید."); return; }
    if ((action === "forward" || action === "reply") && !note) { setError("توضیحات را وارد کنید."); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/appointments/workflow/${entesabId}/referrals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, referralId, destinationPostIds: action === "forward" ? selectedPosts : [], note }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message || "ثبت عملیات ارجاع انجام نشد.");
      setMessage(data.message || "عملیات انجام شد.");
      setSelectedPosts([]); setForwardNote(""); setReplyId(null); setReplyNote("");
      await onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت عملیات ارجاع انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  const filterItems: Array<{ key: Filter; label: string }> = [
    { key: "all", label: "همه ارجاعات" },
    { key: "inbox", label: "دریافتی" },
    { key: "sent", label: "ارسالی" },
    { key: "archive", label: "بایگانی" },
  ];

  return <div className={styles.referralsWorkspace}>
    <section className={styles.referralListPanel}>
      <header className={styles.referralPanelHeader}>
        <div><span>زنجیره گردش درخواست</span><strong>{referrals.length.toLocaleString("fa-IR")} ارجاع ثبت‌شده</strong></div>
        <nav>{filterItems.map((item) => <button type="button" key={item.key} className={filter === item.key ? styles.activeReferralFilter : ""} onClick={() => setFilter(item.key)}>{item.label}<span>{counts[item.key].toLocaleString("fa-IR")}</span></button>)}</nav>
      </header>

      {message ? <div className={styles.referralSuccess}>{message}</div> : null}
      {error ? <div className={styles.inlineError}>{error}</div> : null}

      <div className={styles.referralTimeline}>
        {visible.length ? visible.map((item) => {
          const depth = computeDepth(item, byId);
          const branchStyle = { "--referral-depth": depth } as CSSProperties;
          return <article key={item.ReferralId} className={`${styles.referralCard} ${item.StatusCode === 4 ? styles.recalledReferral : item.StatusCode === 1 ? styles.unreadReferral : ""}`} style={branchStyle}>
            <div className={styles.referralRoute}>
              <div><small>از</small><strong>{item.FromPostTitle || "—"}</strong><span>{item.FromFullName || item.CreateByFullName || "بدون متصدی"}</span></div>
              <i><ReferralArrow /></i>
              <div><small>به</small><strong>{item.ToPostTitle || "—"}</strong><span>{item.ToFullName || "بدون متصدی"}</span></div>
            </div>
            {item.Note ? <p>{item.Note}</p> : null}
            <footer>
              <div className={styles.referralMeta}>
                <span className={item.StatusCode === 1 ? styles.unreadState : item.StatusCode === 4 ? styles.recalledState : styles.readState}>{item.StatusTitle || "—"}</span>
                <span>{item.CreateDateTime || "—"}</span>
                {item.IsRead ? <span>مشاهده: {item.ReadByFullName || "—"} · {item.ReadDateTime || "—"}</span> : null}
              </div>
              <div className={styles.referralActions}>
                {item.CanReply && !item.IsArchivedForActor ? <button type="button" onClick={() => { setReplyId(item.ReferralId); setReplyNote(""); setError(""); }}>پاسخ</button> : null}
                {item.CanRecall && !item.IsArchivedForActor ? <button type="button" className={styles.recallButton} disabled={saving} onClick={() => void runAction("recall", item.ReferralId)}>بازپس‌گیری</button> : null}
                {item.CanArchive ? <button type="button" disabled={saving} onClick={() => void runAction(item.IsArchivedForActor ? "restore" : "archive", item.ReferralId)}>{item.IsArchivedForActor ? "خروج از بایگانی" : "بایگانی"}</button> : null}
              </div>
            </footer>
            {replyId === item.ReferralId ? <div className={styles.replyComposer}>
              <textarea value={replyNote} onChange={(event) => setReplyNote(event.target.value.slice(0, 1000))} placeholder="متن پاسخ ارجاع..." rows={3} />
              <div><button type="button" onClick={() => { setReplyId(null); setReplyNote(""); }}>انصراف</button><button type="button" className={styles.sendReferralButton} disabled={saving} onClick={() => void runAction("reply", item.ReferralId)}>{saving ? "در حال ثبت..." : "ثبت و ارسال پاسخ"}</button></div>
            </div> : null}
          </article>;
        }) : <div className={styles.emptyReferrals}>در این بخش ارجاعی وجود ندارد.</div>}
      </div>
    </section>

    <aside className={styles.referralComposer}>
      <header><span>ارجاع جدید</span><strong>{context?.ActorPostTitle || "پست جاری"}</strong></header>
      {context?.CanRefer ? <>
        <label className={styles.referralSearch}>جست‌وجوی گیرنده<input value={postSearch} onChange={(event) => setPostSearch(event.target.value)} placeholder="عنوان پست یا نام متصدی..." /></label>
        <div className={styles.referralPostList}>
          {visiblePosts.length ? visiblePosts.map((post) => <label key={post.PostId} className={selectedPosts.includes(post.PostId) ? styles.selectedReferralPost : ""}>
            <input type="checkbox" checked={selectedPosts.includes(post.PostId)} onChange={(event) => setSelectedPosts((current) => event.target.checked ? [...current, post.PostId] : current.filter((id) => id !== post.PostId))} />
            <span><strong>{post.PostTitle}</strong><small>{post.AssigneeFullName || "بدون متصدی فعال"}</small></span>
          </label>) : <p>گیرنده‌ای در محدوده دسترسی پیدا نشد.</p>}
        </div>
        <label className={styles.forwardNote}>توضیحات ارجاع<textarea value={forwardNote} onChange={(event) => setForwardNote(event.target.value.slice(0, 1000))} rows={4} placeholder="موضوع و اقدام مورد انتظار را بنویسید..." /></label>
        <button type="button" className={styles.sendReferralButton} disabled={saving || !selectedPosts.length} onClick={() => void runAction("forward")}>{saving ? "در حال ارسال..." : `ارجاع به ${selectedPosts.length ? selectedPosts.length.toLocaleString("fa-IR") : ""} گیرنده`}</button>
      </> : <div className={styles.noReferralAccess}>این درخواست در کارتابل اقدام شما نیست؛ سوابق ارجاعات همچنان قابل مشاهده است.</div>}
    </aside>
  </div>;
}
