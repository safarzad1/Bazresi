"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import styles from "./Dashboard.module.css";

type InboxItem = {
  entesabId: number;
  fullName: string | null;
  postTitle: string | null;
  requesterFullName: string | null;
  createDateTime: string | null;
  unread: boolean;
};

type AppointmentInbox = {
  pendingCount: number;
  unreadCount: number;
  items: InboxItem[];
};

type ModuleKey = "persons" | "appointments" | "cancellations" | "evaluation" | "inspection";
type Metric = { label: string; value: number; suffix?: string; hint: string; tone: "teal" | "blue" | "amber" | "purple" };
type ChartItem = { label: string; value: number; display: string };
type ModuleData = {
  title: string; description: string; eyebrow: string; href: string | null; action: string;
  metrics: Metric[]; chartTitle: string; chartDescription: string; chart: ChartItem[];
  statusTitle: string; statuses: { label: string; value: number; color: string }[];
};

const modules: Record<ModuleKey, ModuleData> = {
  persons: {
    title: "اشخاص", eyebrow: "پرونده‌های هویتی", description: "نمای کلی ثبت و تکمیل اطلاعات اشخاص سامانه", href: "/Admin/Persons", action: "مشاهده فهرست اشخاص",
    metrics: [{label:"کل اشخاص",value:1248,hint:"تمام پرونده‌های ثبت‌شده",tone:"teal"},{label:"پرونده کامل",value:936,hint:"۷۵٪ از کل پرونده‌ها",tone:"blue"},{label:"پیش‌نویس",value:312,hint:"نیازمند تکمیل اطلاعات",tone:"amber"},{label:"ثبت ماه جاری",value:84,hint:"۱۲٪ رشد نسبت به ماه قبل",tone:"purple"}],
    chartTitle:"روند ثبت پرونده",chartDescription:"تعداد پرونده‌های ایجادشده در شش ماه اخیر",chart:[{label:"فروردین",value:38,display:"۳۸"},{label:"اردیبهشت",value:56,display:"۵۶"},{label:"خرداد",value:49,display:"۴۹"},{label:"تیر",value:71,display:"۷۱"},{label:"مرداد",value:64,display:"۶۴"},{label:"شهریور",value:84,display:"۸۴"}],
    statusTitle:"وضعیت تکمیل پرونده‌ها",statuses:[{label:"کامل",value:75,color:"#188b87"},{label:"در حال تکمیل",value:18,color:"#e6a23c"},{label:"فاقد اطلاعات ضروری",value:7,color:"#d76573"}],
  },
  appointments: {
    title:"انتصابات",eyebrow:"فرایندهای سازمانی",description:"درخواست‌ها، بررسی‌ها و ابلاغ‌های انتصاب",href:"/Admin/Appointments/Workflow",action:"ورود به فرایند انتصابات",
    metrics:[{label:"کل درخواست‌ها",value:184,hint:"در سال جاری",tone:"teal"},{label:"ابلاغ فعال",value:96,hint:"انتصاب‌های در حال خدمت",tone:"blue"},{label:"در انتظار بررسی",value:23,hint:"در کارتابل تصمیم‌گیری",tone:"amber"},{label:"عدم تأیید",value:11,hint:"۶٪ از کل درخواست‌ها",tone:"purple"}],
    chartTitle:"درخواست‌های انتصاب",chartDescription:"تعداد درخواست‌های ثبت‌شده در شش ماه اخیر",chart:[{label:"فروردین",value:18,display:"۱۸"},{label:"اردیبهشت",value:27,display:"۲۷"},{label:"خرداد",value:22,display:"۲۲"},{label:"تیر",value:31,display:"۳۱"},{label:"مرداد",value:39,display:"۳۹"},{label:"شهریور",value:47,display:"۴۷"}],
    statusTitle:"وضعیت گردش کار",statuses:[{label:"تأیید و ابلاغ",value:52,color:"#188b87"},{label:"در حال بررسی",value:31,color:"#e6a23c"},{label:"عدم تأیید",value:6,color:"#d76573"},{label:"سایر وضعیت‌ها",value:11,color:"#6d82ae"}],
  },
  cancellations: {
    title:"لغو انتصاب",eyebrow:"مدیریت ابلاغ‌ها",description:"کنترل پیشنهادها و تصمیم‌های لغو انتصاب",href:"/Admin/Appointments/Cancellations",action:"مشاهده درخواست‌های لغو",
    metrics:[{label:"کل درخواست‌ها",value:38,hint:"در سال جاری",tone:"teal"},{label:"تأییدشده",value:24,hint:"۶۳٪ از درخواست‌ها",tone:"blue"},{label:"در انتظار تصمیم",value:9,hint:"نیازمند اقدام",tone:"amber"},{label:"ردشده",value:5,hint:"۱۳٪ از درخواست‌ها",tone:"purple"}],
    chartTitle:"روند درخواست لغو",chartDescription:"مقایسه تعداد درخواست‌های لغو در ماه‌های اخیر",chart:[{label:"فروردین",value:3,display:"۳"},{label:"اردیبهشت",value:5,display:"۵"},{label:"خرداد",value:4,display:"۴"},{label:"تیر",value:8,display:"۸"},{label:"مرداد",value:7,display:"۷"},{label:"شهریور",value:11,display:"۱۱"}],
    statusTitle:"نتیجه درخواست‌ها",statuses:[{label:"تأیید لغو",value:63,color:"#188b87"},{label:"در انتظار تصمیم",value:24,color:"#e6a23c"},{label:"عدم تأیید",value:13,color:"#d76573"}],
  },
  evaluation: {
    title:"ارزشیابی",eyebrow:"سنجش عملکرد",description:"نمای کلی ارسال، پاسخ و نتیجه ارزشیابی‌ها",href:"/Admin/Evaluation",action:"ورود به بخش ارزشیابی",
    metrics:[{label:"کل ارزشیابی‌ها",value:326,hint:"در دوره فعال",tone:"teal"},{label:"پاسخ داده‌شده",value:248,hint:"۷۶٪ تکمیل شده",tone:"blue"},{label:"در انتظار پاسخ",value:78,hint:"نیازمند پیگیری",tone:"amber"},{label:"میانگین امتیاز",value:82,suffix:"٪",hint:"میانگین دوره جاری",tone:"purple"}],
    chartTitle:"میزان مشارکت",chartDescription:"درصد تکمیل ارزشیابی به تفکیک سطح سازمانی",chart:[{label:"مدیران کل",value:91,display:"۹۱٪"},{label:"مدیران",value:83,display:"۸۳٪"},{label:"رؤسا",value:76,display:"۷۶٪"},{label:"کارشناسان",value:68,display:"۶۸٪"}],
    statusTitle:"توزیع نتایج",statuses:[{label:"عالی",value:28,color:"#188b87"},{label:"خیلی خوب",value:39,color:"#4d8fc7"},{label:"خوب",value:25,color:"#e6a23c"},{label:"قابل بهبود",value:8,color:"#d76573"}],
  },
  inspection: {
    title:"بازرسی",eyebrow:"نظارت و پیگیری",description:"نمای کلی پرونده‌ها و اقدامات نظارتی",href:null,action:"بخش بازرسی در حال آماده‌سازی است",
    metrics:[{label:"کل پرونده‌ها",value:142,hint:"پرونده‌های ثبت‌شده",tone:"teal"},{label:"مختومه",value:102,hint:"۷۲٪ از پرونده‌ها",tone:"blue"},{label:"در حال بررسی",value:31,hint:"در چرخه رسیدگی",tone:"amber"},{label:"دارای اولویت",value:9,hint:"نیازمند اقدام سریع",tone:"purple"}],
    chartTitle:"فعالیت‌های نظارتی",chartDescription:"تعداد پرونده‌های ایجادشده در شش ماه اخیر",chart:[{label:"فروردین",value:14,display:"۱۴"},{label:"اردیبهشت",value:19,display:"۱۹"},{label:"خرداد",value:16,display:"۱۶"},{label:"تیر",value:27,display:"۲۷"},{label:"مرداد",value:29,display:"۲۹"},{label:"شهریور",value:37,display:"۳۷"}],
    statusTitle:"وضعیت رسیدگی",statuses:[{label:"مختومه",value:72,color:"#188b87"},{label:"در حال بررسی",value:22,color:"#e6a23c"},{label:"اولویت‌دار",value:6,color:"#d76573"}],
  },
};

const tabOrder: ModuleKey[] = ["persons","appointments","cancellations","evaluation","inspection"];
const toFa = (value:number) => value.toLocaleString("fa-IR");

function ModuleIcon({name}:{name:ModuleKey}) {
  const paths:Record<ModuleKey,ReactNode>={persons:<><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1.4A6.6 6.6 0 0 1 11.6 12h.8a6.6 6.6 0 0 1 6.6 6.6V20"/></>,appointments:<><path d="M6 4h12v16H6z"/><path d="M9 2v4M15 2v4M9 10h6M9 14h6"/></>,cancellations:<><path d="M6 4h12v16H6z"/><path d="M9 2v4M15 2v4M9 11h6M9 15l6-6"/></>,evaluation:<><path d="M5 4h14v16H5z"/><path d="m8 10 1.5 1.5L12 9M14 10h2M8 15h8"/></>,inspection:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5M8 10.5l1.5 1.5 3-3"/></>};
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function DashboardClient({mustChangePassword,personsAllowed,workflowAllowed,cancellationsAllowed,evaluationAllowed}:{mustChangePassword:boolean;personsAllowed:boolean;workflowAllowed:boolean;cancellationsAllowed:boolean;evaluationAllowed:boolean}) {
  const availableTabs=useMemo<ModuleKey[]>(()=>tabOrder.filter((key)=>{
    if(key==="persons")return personsAllowed;
    if(key==="appointments")return workflowAllowed;
    if(key==="cancellations")return cancellationsAllowed;
    if(key==="evaluation")return evaluationAllowed;
    return true;
  }),[personsAllowed,workflowAllowed,cancellationsAllowed,evaluationAllowed]);
  const [active,setActive]=useState<ModuleKey>(()=>availableTabs[0]??"inspection");
  const [appointmentInbox,setAppointmentInbox]=useState<AppointmentInbox>({pendingCount:0,unreadCount:0,items:[]});
  const [inboxLoading,setInboxLoading]=useState(workflowAllowed);
  const selected=modules[active];
  const maxChartValue=useMemo(()=>Math.max(...selected.chart.map(item=>item.value),1),[selected]);

  useEffect(()=>{
    if(!availableTabs.includes(active))setActive(availableTabs[0]??"inspection");
  },[active,availableTabs]);

  useEffect(()=>{
    if(!workflowAllowed)return;
    let activeRequest=true;
    async function loadInbox(){
      setInboxLoading(true);
      try{
        const response=await fetch("/api/appointments/notifications",{cache:"no-store"});
        if(!response.ok)return;
        const payload=(await response.json()) as AppointmentInbox;
        if(activeRequest)setAppointmentInbox({pendingCount:Number(payload.pendingCount||0),unreadCount:Number(payload.unreadCount||0),items:Array.isArray(payload.items)?payload.items:[]});
      }catch{
        // داشبورد در خطای موقت کارتابل همچنان قابل استفاده می‌ماند.
      }finally{if(activeRequest)setInboxLoading(false);}
    }
    void loadInbox();
    const timer=window.setInterval(()=>void loadInbox(),60_000);
    return()=>{activeRequest=false;window.clearInterval(timer);};
  },[workflowAllowed]);

  return <main className={styles.page} dir="rtl">
    {mustChangePassword&&<div className={styles.notice}>برای افزایش امنیت حساب، لازم است رمز عبور خود را تغییر دهید.</div>}
    {workflowAllowed&&<section className={styles.appointmentInbox} aria-label="درخواست‌های رسیده انتصابات">
      <header><div><span>کارتابل انتصابات</span><h2>درخواست‌های رسیده به شما</h2></div><div className={styles.inboxCounters}><span><b>{appointmentInbox.unreadCount.toLocaleString("fa-IR")}</b> جدید</span><span><b>{appointmentInbox.pendingCount.toLocaleString("fa-IR")}</b> در انتظار اقدام</span></div></header>
      <div className={styles.inboxRows}>{inboxLoading&&!appointmentInbox.items.length?<p>در حال دریافت کارتابل...</p>:appointmentInbox.items.length?appointmentInbox.items.slice(0,4).map(item=><Link href={`/Admin/Appointments/Workflow?request=${item.entesabId}`} key={item.entesabId} className={item.unread?styles.newInboxRow:""}><i/><span><strong>{item.fullName||"فرد پیشنهادی"}</strong><small>{item.postTitle||"پیشنهاد انتصاب"}{item.requesterFullName?` · از ${item.requesterFullName}`:""}</small></span><em>{item.unread?"جدید":"در انتظار"}</em></Link>):<p>درخواست جدیدی در کارتابل انتصابات شما نیست.</p>}</div>
      {appointmentInbox.pendingCount>0&&<Link className={styles.openInbox} href="/Admin/Appointments/Workflow">همه <b>←</b></Link>}
    </section>}
    <div className={styles.demoNotice}><span>نسخه نمایشی داشبورد</span> اعداد این صفحه فعلاً نمونه هستند و پس از تأیید ظاهر به اطلاعات واقعی متصل می‌شوند.</div>
    <nav className={styles.moduleTabs} aria-label="بخش‌های داشبورد">{availableTabs.map(key=><button type="button" key={key} className={active===key?styles.activeTab:""} onClick={()=>setActive(key)}><span className={styles.tabIcon}><ModuleIcon name={key}/></span><span><strong>{modules[key].title}</strong><small>{modules[key].eyebrow}</small></span></button>)}</nav>
    <section className={styles.moduleHeading}><div><span>{selected.eyebrow}</span><h2>{selected.title}</h2><p>{selected.description}</p></div>{selected.href?<Link href={selected.href}>{selected.action}<b>←</b></Link>:<span className={styles.disabledAction}>{selected.action}</span>}</section>
    <section className={styles.metrics}>{selected.metrics.map(metric=><article className={styles.metricCard} key={metric.label}><div className={`${styles.metricMark} ${styles[metric.tone]}`}/><div><span>{metric.label}</span><strong>{toFa(metric.value)}{metric.suffix}</strong><small>{metric.hint}</small></div></article>)}</section>
    <section className={styles.analyticsGrid}><article className={styles.chartCard}><header><div><h3>{selected.chartTitle}</h3><p>{selected.chartDescription}</p></div><span>نمایش آماری</span></header><div className={`${styles.barChart} ${selected.chart.length<=4?styles.wideBars:""}`}>{selected.chart.map(item=><div className={styles.barItem} key={item.label}><span className={styles.barValue}>{item.display}</span><div className={styles.barTrack}><i style={{height:`${Math.max(12,Math.round(item.value/maxChartValue*100))}%`}}/></div><small>{item.label}</small></div>)}</div></article>
      <article className={styles.statusCard}><header><h3>{selected.statusTitle}</h3><span>درصد از کل</span></header><div className={styles.statusList}>{selected.statuses.map(item=><div key={item.label}><div><span><i style={{background:item.color}}/>{item.label}</span><strong>{toFa(item.value)}٪</strong></div><div className={styles.progress}><i style={{width:`${item.value}%`,background:item.color}}/></div></div>)}</div><div className={styles.totalRing}><div><strong>{toFa(selected.metrics[0].value)}</strong><span>{selected.metrics[0].label}</span></div></div></article></section>
  </main>;
}
