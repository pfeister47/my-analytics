import { useState, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:"#080c14", surface:"#0f1623", card:"#131d2e", border:"#1c2a3d", borderHover:"#2a3f5a",
  text:"#dce8f5", muted:"#4a6080", accent:"#00d9c0", accentDim:"#00d9c015",
  red:"#ff5c6a", yellow:"#ffc542", purple:"#9b7fe8", blue:"#4da6ff", green:"#00d9c0",
};
const PARTNER_COLORS = ["#00d9c0","#9b7fe8","#ff5c6a","#ffc542","#4da6ff","#ff9d5c","#80e882"];

// ─── Sample Data (long-format, matching Google Sheets structure) ───────────────
const SAMPLE_DATA = [
  {id:"P001",partner:"Acme Corp",   product:"Photo Session",country:"USA",      numImages:120,month:"2024-01",revenue:{deliverablesApproved:1800,additionalDeliverables:300, lastMinuteReschedule:0,  travel:250, other:0},expenses:{base:800, additionalDeliverables:150,lastMinuteReschedule:0,  travel:200,other:0}},
  {id:"P002",partner:"Acme Corp",   product:"Video Package",country:"USA",      numImages:60, month:"2024-01",revenue:{deliverablesApproved:2800,additionalDeliverables:0,   lastMinuteReschedule:350,travel:450, other:0},expenses:{base:1200,additionalDeliverables:0,  lastMinuteReschedule:200,travel:400,other:0}},
  {id:"P003",partner:"Blue Wave",   product:"Photo Session",country:"Canada",   numImages:200,month:"2024-02",revenue:{deliverablesApproved:2500,additionalDeliverables:400, lastMinuteReschedule:0,  travel:350, other:0},expenses:{base:1100,additionalDeliverables:200,lastMinuteReschedule:0,  travel:300,other:0}},
  {id:"P004",partner:"Blue Wave",   product:"Drone Footage",country:"Canada",   numImages:80, month:"2024-02",revenue:{deliverablesApproved:2200,additionalDeliverables:200, lastMinuteReschedule:0,  travel:550, other:0},expenses:{base:900, additionalDeliverables:100,lastMinuteReschedule:0,  travel:500,other:0}},
  {id:"P005",partner:"Stellar Inc", product:"Photo Session",country:"UK",       numImages:150,month:"2024-03",revenue:{deliverablesApproved:2100,additionalDeliverables:0,   lastMinuteReschedule:450,travel:650, other:0},expenses:{base:950, additionalDeliverables:0,  lastMinuteReschedule:300,travel:600,other:0}},
  {id:"P006",partner:"Stellar Inc", product:"Video Package",country:"UK",       numImages:90, month:"2024-03",revenue:{deliverablesApproved:3200,additionalDeliverables:500, lastMinuteReschedule:0,  travel:780, other:0},expenses:{base:1500,additionalDeliverables:300,lastMinuteReschedule:0,  travel:700,other:0}},
  {id:"P007",partner:"Nexus Media", product:"Drone Footage",country:"Australia",numImages:50, month:"2024-04",revenue:{deliverablesApproved:1900,additionalDeliverables:0,   lastMinuteReschedule:0,  travel:1300,other:0},expenses:{base:700, additionalDeliverables:0,  lastMinuteReschedule:0,  travel:1200,other:0}},
  {id:"P008",partner:"Nexus Media", product:"Photo Session",country:"Australia",numImages:180,month:"2024-04",revenue:{deliverablesApproved:2400,additionalDeliverables:450, lastMinuteReschedule:180,travel:1000,other:0},expenses:{base:1050,additionalDeliverables:250,lastMinuteReschedule:100,travel:900,other:0}},
  {id:"P009",partner:"Acme Corp",   product:"Photo Session",country:"USA",      numImages:135,month:"2024-05",revenue:{deliverablesApproved:1950,additionalDeliverables:220, lastMinuteReschedule:0,  travel:270, other:0},expenses:{base:850, additionalDeliverables:100,lastMinuteReschedule:0,  travel:220,other:0}},
  {id:"P010",partner:"Blue Wave",   product:"Video Package",country:"Canada",   numImages:75, month:"2024-05",revenue:{deliverablesApproved:3000,additionalDeliverables:300, lastMinuteReschedule:400,travel:400, other:0},expenses:{base:1300,additionalDeliverables:150,lastMinuteReschedule:250,travel:350,other:0}},
  {id:"P011",partner:"Stellar Inc", product:"Drone Footage",country:"France",   numImages:65, month:"2024-06",revenue:{deliverablesApproved:2000,additionalDeliverables:150, lastMinuteReschedule:0,  travel:900, other:0},expenses:{base:780, additionalDeliverables:80, lastMinuteReschedule:0,  travel:850,other:0}},
  {id:"P012",partner:"Nexus Media", product:"360 Tour",     country:"Germany",  numImages:200,month:"2024-06",revenue:{deliverablesApproved:3800,additionalDeliverables:700, lastMinuteReschedule:0,  travel:820, other:0},expenses:{base:1600,additionalDeliverables:400,lastMinuteReschedule:0,  travel:750,other:0}},
];

// ─── Keys & Labels ────────────────────────────────────────────────────────────
const EXP_KEYS   = ["base","additionalDeliverables","lastMinuteReschedule","travel","other"];
const REV_KEYS   = ["deliverablesApproved","additionalDeliverables","lastMinuteReschedule","travel","other"];
const EXP_LABELS = {base:"Base Amount",additionalDeliverables:"Additional Deliverables",lastMinuteReschedule:"Last Minute Reschedule",travel:"Travel",other:"Other"};
const REV_LABELS = {deliverablesApproved:"Deliverables Approved",additionalDeliverables:"Additional Deliverables",lastMinuteReschedule:"Last Minute Reschedule",travel:"Travel",other:"Other"};

const totalExp = p => EXP_KEYS.reduce((s,k)=>s+(p.expenses[k]||0),0);
const totalRev = p => REV_KEYS.reduce((s,k)=>s+(p.revenue[k]||0),0);
const calcTotals = p => {
  const te=totalExp(p),tr=totalRev(p),m=tr-te;
  return {totalExpenses:te,totalRevenue:tr,margin:m,
    marginPct:tr>0?(m/tr)*100:0,
    revenuePerImage:p.numImages>0?tr/p.numImages:0,
    expensePerImage:p.numImages>0?te/p.numImages:0};
};

const fmt   = n => `$${Math.round(n).toLocaleString("en-US")}`;
const fmtD  = n => `$${Number(n).toFixed(2)}`;
const fmtP  = n => `${Number(n).toFixed(1)}%`;
const fmtMonth = m => {
  if (!m||m==="Unknown") return m||"?";
  const [y,mo]=m.split("-");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+mo-1]} ${y}`;
};
const metricColor = v => v>=40?C.accent:v>=25?C.yellow:C.red;

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const ChartTooltip = ({active,payload,label,valueFormatter=fmt})=>{
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",fontFamily:"'DM Sans',sans-serif",minWidth:180}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:8,fontFamily:"'Space Mono',monospace"}}>{label}</div>
      {payload.map((e,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:24,fontSize:13,marginBottom:3}}>
          <span style={{color:e.color,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:8,height:8,borderRadius:2,background:e.color,display:"inline-block"}}/>
            {e.name}
          </span>
          <span style={{color:C.text,fontWeight:600}}>{valueFormatter(e.value)}</span>
        </div>
      ))}
      {payload.length>1&&(
        <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:13}}>
          <span style={{color:C.muted}}>Total</span>
          <span style={{color:C.accent,fontWeight:700}}>{valueFormatter(payload.reduce((s,e)=>s+e.value,0))}</span>
        </div>
      )}
    </div>
  );
};

// ─── Chart 1: Revenue by Partner by Month ────────────────────────────────────
function RevenueByPartnerChart({projects}){
  const partners=[...new Set(projects.map(p=>p.partner))];
  const months=[...new Set(projects.map(p=>p.month))].filter(Boolean).sort();
  const data=months.map(m=>{
    const row={month:fmtMonth(m)};
    partners.forEach(pt=>{row[pt]=projects.filter(p=>p.month===m&&p.partner===pt).reduce((s,p)=>s+totalRev(p),0);});
    return row;
  });
  return(
    <div style={S.chartCard}>
      <div style={S.chartHeader}>
        <div style={S.chartTitle}>Revenue by Partner</div>
        <div style={S.chartSub}>Monthly stacked breakdown</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>v>=1000?`$${v/1000}k`:`$${v}`} tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTooltip/>}/>
          <Legend wrapperStyle={{paddingTop:16,fontSize:12,fontFamily:"DM Sans"}} formatter={v=><span style={{color:C.text}}>{v}</span>}/>
          {partners.map((pt,i)=><Bar key={pt} dataKey={pt} stackId="a" fill={PARTNER_COLORS[i%PARTNER_COLORS.length]} radius={i===partners.length-1?[4,4,0,0]:[0,0,0,0]}/>)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 2: Expense per Image by Product ────────────────────────────────────
function ExpensePerImageChart({projects}){
  const products=[...new Set(projects.map(p=>p.product))];
  const data=products.map(prod=>{
    const sub=projects.filter(p=>p.product===prod);
    const imgs=sub.reduce((s,p)=>s+p.numImages,0);
    if(!imgs) return null;
    const core=sub.reduce((s,p)=>s+p.expenses.base+p.expenses.additionalDeliverables,0);
    const vari=sub.reduce((s,p)=>s+p.expenses.lastMinuteReschedule+p.expenses.travel+p.expenses.other,0);
    return{product:prod,"Core (Base + Add.Deliv.)":core/imgs,"Variable (LMR + Travel + Other)":vari/imgs};
  }).filter(Boolean);
  return(
    <div style={S.chartCard}>
      <div style={S.chartHeader}>
        <div style={S.chartTitle}>Expense per Image by Product</div>
        <div style={S.chartSub}>Core vs variable cost per image</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="product" tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>`$${v.toFixed(1)}`} tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTooltip valueFormatter={fmtD}/>}/>
          <Legend wrapperStyle={{paddingTop:16,fontSize:12,fontFamily:"DM Sans"}} formatter={v=><span style={{color:C.text}}>{v}</span>}/>
          <Bar dataKey="Core (Base + Add.Deliv.)" stackId="a" fill={C.accent} radius={[0,0,0,0]}/>
          <Bar dataKey="Variable (LMR + Travel + Other)" stackId="a" fill={C.yellow} radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 3: Travel Expenses by Partner by Month ─────────────────────────────
function TravelExpenseChart({projects}){
  const partners=[...new Set(projects.map(p=>p.partner))];
  const months=[...new Set(projects.map(p=>p.month))].filter(Boolean).sort();
  const data=months.map(m=>{
    const row={month:fmtMonth(m)};
    partners.forEach(pt=>{row[pt]=projects.filter(p=>p.month===m&&p.partner===pt).reduce((s,p)=>s+(p.expenses.travel||0),0);});
    return row;
  });
  return(
    <div style={S.chartCard}>
      <div style={S.chartHeader}>
        <div style={S.chartTitle}>Travel Expenses by Partner</div>
        <div style={S.chartSub}>Monthly travel costs by partner</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>v>=1000?`$${v/1000}k`:`$${v}`} tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTooltip/>}/>
          <Legend wrapperStyle={{paddingTop:16,fontSize:12,fontFamily:"DM Sans"}} formatter={v=><span style={{color:C.text}}>{v}</span>}/>
          {partners.map((pt,i)=><Bar key={pt} dataKey={pt} stackId="a" fill={PARTNER_COLORS[i%PARTNER_COLORS.length]} radius={i===partners.length-1?[3,3,0,0]:[0,0,0,0]}/>)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Google Sheets Panel ──────────────────────────────────────────────────────
function SheetsPanel({onImport,onClose}){
  const [url,setUrl]=useState("");
  const [status,setStatus]=useState(null);
  const [loading,setLoading]=useState(false);

  const connect=async()=>{
    if(!url.includes("docs.google.com")){setStatus({type:"error",msg:"Please enter a valid Google Sheets URL."});return;}
    setLoading(true);setStatus(null);
    try{
      const res=await fetch("/api/sheets",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({sheetUrl:url}),
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Unknown error");
      onImport(data.projects);
      setStatus({type:"success",msg:`✓ Loaded ${data.count} projects from Google Sheets`});
    }catch(e){
      setStatus({type:"error",msg:e.message});
    }finally{setLoading(false);}
  };

  const inp={background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"9px 13px",fontSize:13,fontFamily:"'DM Sans',sans-serif",width:"100%",outline:"none",boxSizing:"border-box"};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(4,8,18,0.88)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,width:520,boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
        <div style={{padding:"24px 28px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:18,color:C.text,fontFamily:"'DM Sans',sans-serif"}}>📊 Sync Google Sheets</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2,fontFamily:"'Space Mono',monospace"}}>Revenue + Expenses tabs</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:22}}>×</button>
        </div>
        <div style={{padding:28,display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:12,color:C.muted,fontFamily:"'Space Mono',monospace",lineHeight:1.7,background:C.bg,padding:12,borderRadius:8,border:`1px solid ${C.border}`}}>
            Make sure the sheet is shared with your service account email (Viewer access). The app expects tabs named <span style={{color:C.accent}}>Revenue</span> and <span style={{color:C.accent}}>Expenses</span>.
          </div>
          <div>
            <label style={S.label}>Google Sheets URL</label>
            <input style={inp} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..."/>
          </div>
          <button onClick={connect} disabled={loading} style={{...S.primaryBtn,opacity:loading?0.6:1,cursor:loading?"not-allowed":"pointer"}}>
            {loading?"Connecting…":"Sync Data"}
          </button>
          {status&&(
            <div style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${status.type==="error"?C.red:C.accent}`,background:status.type==="error"?`${C.red}15`:`${C.accent}15`,color:status.type==="error"?C.red:C.accent,fontSize:12,fontFamily:"'Space Mono',monospace",lineHeight:1.6}}>
              {status.msg}
            </div>
          )}
          {status?.type==="success"&&(
            <button onClick={onClose} style={{...S.primaryBtn,background:C.accent}}>Done</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Grouped Analysis ─────────────────────────────────────────────────────────
function GroupedAnalysis({data,groupBy}){
  const grouped=useMemo(()=>{
    const map={};
    data.forEach(p=>{const k=p[groupBy];(map[k]=map[k]||[]).push(p);});
    return Object.entries(map).map(([key,ps])=>{
      const agg=ps.reduce((a,p)=>{const t=calcTotals(p);return{rev:a.rev+t.totalRevenue,exp:a.exp+t.totalExpenses,imgs:a.imgs+p.numImages,cnt:a.cnt+1};},{rev:0,exp:0,imgs:0,cnt:0});
      const margin=agg.rev-agg.exp,mp=agg.rev>0?(margin/agg.rev)*100:0;
      return{key,...agg,margin,marginPct:mp,revPerImg:agg.imgs>0?agg.rev/agg.imgs:0,expPerImg:agg.imgs>0?agg.exp/agg.imgs:0};
    }).sort((a,b)=>b.rev-a.rev);
  },[data,groupBy]);
  const maxRev=Math.max(...grouped.map(g=>g.rev),1);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {grouped.map((g,i)=>(
        <div key={g.key} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px",transition:"border-color 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHover}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:2,background:PARTNER_COLORS[i%PARTNER_COLORS.length]}}/>
              <span style={{fontWeight:700,color:C.text,fontSize:15,fontFamily:"'DM Sans',sans-serif"}}>{g.key}</span>
              <span style={{fontSize:11,color:C.muted,fontFamily:"'Space Mono',monospace"}}>{g.cnt} project{g.cnt!==1?"s":""}</span>
            </div>
            <div style={{display:"flex",gap:20}}>
              {[["REVENUE",fmt(g.rev),C.accent],["EXPENSES",fmt(g.exp),C.red],["MARGIN",fmtP(g.marginPct),metricColor(g.marginPct)],["REV/IMG",fmtD(g.revPerImg),C.purple],["EXP/IMG",fmtD(g.expPerImg),C.yellow]].map(([label,val,color])=>(
                <div key={label} style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:C.muted,fontFamily:"'Space Mono',monospace"}}>{label}</div>
                  <div style={{color,fontWeight:700,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:C.bg,borderRadius:3,height:5,overflow:"hidden"}}>
            <div style={{width:`${(g.rev/maxRev)*100}%`,height:"100%",background:PARTNER_COLORS[i%PARTNER_COLORS.length],borderRadius:3,transition:"width 0.6s ease"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S={
  label:{fontSize:11,color:C.muted,fontFamily:"'Space Mono',monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"},
  primaryBtn:{background:C.accent,color:"#060c14",border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14},
  chartCard:{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"22px 24px"},
  chartHeader:{marginBottom:16},
  chartTitle:{fontWeight:700,fontSize:15,color:C.text,fontFamily:"'DM Sans',sans-serif"},
  chartSub:{fontSize:11,color:C.muted,fontFamily:"'Space Mono',monospace",marginTop:3},
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App(){
  const [projects,setProjects]=useState(SAMPLE_DATA);
  const [view,setView]=useState("dashboard");
  const [editId,setEditId]=useState(null);
  const [groupBy,setGroupBy]=useState("partner");
  const [showSheets,setShowSheets]=useState(false);
  const [lastSync,setLastSync]=useState(null);
  const [filters,setFilters]=useState({partner:"All",product:"All",country:"All"});
  const setFilter=(k,v)=>setFilters(f=>({...f,[k]:v}));
  const options=k=>["All",...new Set(projects.map(p=>p[k]))];

  const filtered=useMemo(()=>projects.filter(p=>
    (filters.partner==="All"||p.partner===filters.partner)&&
    (filters.product==="All"||p.product===filters.product)&&
    (filters.country==="All"||p.country===filters.country)
  ),[projects,filters]);

  const totals=useMemo(()=>filtered.reduce((a,p)=>{
    const t=calcTotals(p);return{rev:a.rev+t.totalRevenue,exp:a.exp+t.totalExpenses,imgs:a.imgs+p.numImages};
  },{rev:0,exp:0,imgs:0}),[filtered]);

  const margin=totals.rev-totals.exp,marginPct=totals.rev>0?(margin/totals.rev)*100:0;

  const handleImport=rows=>{
    setProjects(rows);
    setLastSync(new Date().toLocaleTimeString());
    setShowSheets(false);
  };

  const deleteProject=id=>setProjects(prev=>prev.filter(p=>p.id!==id));

  const navBtn=(label,key)=>(
    <button onClick={()=>setView(key)} style={{background:view===key?`${C.accent}15`:"transparent",color:view===key?C.accent:C.muted,border:"none",borderRadius:8,padding:"8px 18px",fontWeight:view===key?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,transition:"all 0.2s"}}>
      {label}
    </button>
  );

  const sel={background:C.card,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"7px 12px",fontSize:12,fontFamily:"'Space Mono',monospace",cursor:"pointer",outline:"none"};

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>

      {/* Nav */}
      <div style={{borderBottom:`1px solid ${C.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,position:"sticky",top:0,zIndex:50,background:`${C.bg}ee`,backdropFilter:"blur(10px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:30,height:30,background:`linear-gradient(135deg,${C.accent},${C.purple})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#060c14"}}>▲</div>
          <span style={{fontWeight:700,fontSize:16,letterSpacing:-0.3,fontFamily:"'DM Sans',sans-serif"}}>Revenue Analytics</span>
          <span style={{fontSize:11,color:C.muted,fontFamily:"'Space Mono',monospace"}}>{filtered.length} projects</span>
        </div>
        <div style={{display:"flex",gap:2,alignItems:"center"}}>
          {navBtn("Dashboard","dashboard")}
          {navBtn("Charts","charts")}
          {navBtn("Projects","projects")}
          <div style={{width:1,height:20,background:C.border,margin:"0 8px"}}/>
          <button onClick={()=>setShowSheets(true)} style={{background:`${C.purple}20`,color:C.purple,border:`1px solid ${C.purple}40`,borderRadius:8,padding:"7px 16px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,display:"flex",alignItems:"center",gap:6}}>
            <span>⟳</span> Sync Sheets
            {lastSync&&<span style={{fontSize:10,opacity:0.7}}>{lastSync}</span>}
          </button>
        </div>
      </div>

      <div style={{padding:"24px 28px",maxWidth:1280,margin:"0 auto"}}>
        {/* Filters */}
        {["dashboard","charts","projects"].includes(view)&&(
          <div style={{display:"flex",gap:10,marginBottom:22,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:10,color:C.muted,fontFamily:"'Space Mono',monospace",letterSpacing:1}}>FILTER:</span>
            {["partner","product","country"].map(k=>(
              <select key={k} style={sel} value={filters[k]} onChange={e=>setFilter(k,e.target.value)}>
                {options(k).map(v=><option key={v}>{v}</option>)}
              </select>
            ))}
            {Object.values(filters).some(v=>v!=="All")&&(
              <button onClick={()=>setFilters({partner:"All",product:"All",country:"All"})} style={{background:"transparent",color:C.red,border:"none",cursor:"pointer",fontSize:12,fontFamily:"'Space Mono',monospace"}}>Clear ×</button>
            )}
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {view==="dashboard"&&(<>
          <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
            {[
              ["Total Revenue",    fmt(totals.rev),       C.accent,  `${filtered.length} projects`],
              ["Total Expenses",   fmt(totals.exp),       C.red,     null],
              ["Gross Margin",     fmt(margin),           metricColor(marginPct), fmtP(marginPct)],
              ["Margin %",         fmtP(marginPct),       metricColor(marginPct), marginPct>=40?"✓ Healthy":marginPct>=25?"⚠ Watch":"✗ Low"],
              ["Revenue / Image",  fmtD(totals.imgs>0?totals.rev/totals.imgs:0), C.purple, `${totals.imgs.toLocaleString()} images`],
              ["Expense / Image",  fmtD(totals.imgs>0?totals.exp/totals.imgs:0), C.yellow, null],
            ].map(([label,val,color,sub])=>(
              <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 22px",flex:1,minWidth:140}}>
                <div style={{fontSize:10,fontFamily:"'Space Mono',monospace",color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{label}</div>
                <div style={{fontSize:24,fontWeight:700,color,fontFamily:"'DM Sans',sans-serif",letterSpacing:-0.5}}>{val}</div>
                {sub&&<div style={{fontSize:11,color:C.muted,marginTop:4,fontFamily:"'Space Mono',monospace"}}>{sub}</div>}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
            <span style={{fontSize:11,color:C.muted,fontFamily:"'Space Mono',monospace"}}>GROUP BY:</span>
            {["partner","product","country"].map(g=>(
              <button key={g} onClick={()=>setGroupBy(g)} style={{background:groupBy===g?`${C.accent}15`:"transparent",color:groupBy===g?C.accent:C.muted,border:groupBy===g?`1px solid ${C.accent}40`:"1px solid transparent",borderRadius:6,padding:"5px 14px",cursor:"pointer",fontSize:11,fontFamily:"'Space Mono',monospace",textTransform:"uppercase"}}>
                {g}
              </button>
            ))}
          </div>
          <GroupedAnalysis data={filtered} groupBy={groupBy}/>
        </>)}

        {/* ── CHARTS ── */}
        {view==="charts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <RevenueByPartnerChart projects={filtered}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <ExpensePerImageChart projects={filtered}/>
              <TravelExpenseChart projects={filtered}/>
            </div>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {view==="projects"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {!filtered.length&&<div style={{textAlign:"center",color:C.muted,padding:48,fontFamily:"'Space Mono',monospace"}}>No projects match your filters.</div>}
            {filtered.map(p=>{
              const t=calcTotals(p);
              return(
                <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 22px",transition:"border-color 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHover}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,marginBottom:5,fontFamily:"'DM Sans',sans-serif"}}>{p.partner}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {[p.product,p.country,fmtMonth(p.month),`${p.id}`,`${p.numImages} imgs`].map((tag,i)=>(
                          <span key={i} style={{fontSize:11,background:C.bg,color:C.muted,borderRadius:4,padding:"2px 8px",fontFamily:"'Space Mono',monospace"}}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={()=>deleteProject(p.id)} style={{background:"transparent",color:C.red,border:`1px solid ${C.red}40`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>Remove</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:14}}>
                    {[["Revenue",fmt(t.totalRevenue),C.accent],["Expenses",fmt(t.totalExpenses),C.red],["Margin $",fmt(t.margin),metricColor(t.marginPct)],["Margin %",fmtP(t.marginPct),metricColor(t.marginPct)],["Rev/Img",fmtD(t.revenuePerImage),C.purple],["Exp/Img",fmtD(t.expensePerImage),C.yellow]].map(([label,val,color])=>(
                      <div key={label} style={{background:C.bg,borderRadius:8,padding:"10px 12px"}}>
                        <div style={{fontSize:10,color:C.muted,fontFamily:"'Space Mono',monospace",marginBottom:4}}>{label}</div>
                        <div style={{fontWeight:700,color,fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[[EXP_KEYS,EXP_LABELS,p.expenses,"EXPENSES",C.red],[REV_KEYS,REV_LABELS,p.revenue,"REVENUE",C.accent]].map(([keys,labels,vals,title,color])=>(
                      <div key={title} style={{background:C.bg,borderRadius:8,padding:"12px 14px"}}>
                        <div style={{fontSize:10,color,fontFamily:"'Space Mono',monospace",marginBottom:8,letterSpacing:1}}>{title}</div>
                        {keys.map(k=>(
                          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                            <span style={{color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>{labels[k]}</span>
                            <span style={{color:"#c0cad8",fontFamily:"'Space Mono',monospace"}}>{fmt(vals[k]||0)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showSheets&&<SheetsPanel onImport={handleImport} onClose={()=>setShowSheets(false)}/>}
    </div>
  );
}