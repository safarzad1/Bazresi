"use client";
import dynamic from "next/dynamic";import styles from "./Workflow.module.css";
const Client=dynamic(()=>import("./WorkflowClient"),{ssr:false,loading:()=> <div className={styles.initialLoading} dir="rtl"><span className={styles.spinner}/> در حال آماده‌سازی فرایند انتصابات...</div>});
export default function Page(){return <Client/>}
