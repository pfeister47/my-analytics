import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:"#080c14", surface:"#0f1623", card:"#131d2e", border:"#1c2a3d", borderHover:"#2a3f5a",
  text:"#dce8f5", muted:"#4a6080", accent:"#00d9c0", accentDim:"#00d9c015",
  red:"#ff5c6a", yellow:"#ffc542", purple:"#9b7fe8", blue:"#4da6ff", green:"#00d9c0",
};
const PARTNER_COLORS = ["#00d9c0","#9b7fe8","#ff5c6a","#ffc542","#4da6ff","#ff9d5c","#80e882"];

// ─── Named partners — all others become "Other" ───────────────────────────────
const NAMED_PARTNERS = ["Uber Eats", "Uber Eats ANZ", "Deliveroo", "GrubHub"];
// Partners included in Rev/Image and Exp/Image KPI cards
const IMAGE_METRIC_PARTNERS = ["Uber Eats", "Uber Eats ANZ", "Deliveroo", "GrubHub", "ezCater", "Popmenu"];
// Partners included in Expense per Image chart
const EXP_IMAGE_CHART_PARTNERS = ["Uber Eats", "Uber Eats ANZ", "Deliveroo", "GrubHub"];

// Case-insensitive partner name normalization — handles "Grubhub" vs "GrubHub" etc.
const PARTNER_ALIASES = {
  "grubhub": "GrubHub",
  "uber eats": "Uber Eats",
  "uber eats anz": "Uber Eats ANZ",
  "deliveroo": "Deliveroo",
  "ezcater": "ezCater",
  "popmenu": "Popmenu",
};
const normalizePartner = name => {
  if (!name) return name;
  return PARTNER_ALIASES[name.toLowerCase()] || name;
};

// Determine how to show a partner in charts:
// - If a specific partner filter is active and it's not in NAMED_PARTNERS, show that partner name
// - Otherwise group non-named partners as "Other"
const makePartnerGroupFn = (activePartnerFilter) => {
  if (activePartnerFilter && activePartnerFilter !== "All" && !NAMED_PARTNERS.includes(activePartnerFilter)) {
    return p => {
      const n = normalizePartner(p);
      return n === activePartnerFilter ? activePartnerFilter : (NAMED_PARTNERS.includes(n) ? n : "Other");
    };
  }
  return p => {
    const n = normalizePartner(p);
    return NAMED_PARTNERS.includes(n) ? n : "Other";
  };
};

const makeChartPartners = (activePartnerFilter) => {
  if (activePartnerFilter && activePartnerFilter !== "All" && !NAMED_PARTNERS.includes(activePartnerFilter)) {
    return [...NAMED_PARTNERS, activePartnerFilter, "Other"];
  }
  return [...NAMED_PARTNERS, "Other"];
};

const CHART_PARTNER_COLORS = {
  "Uber Eats":     "#00d9c0",
  "Uber Eats ANZ": "#9b7fe8",
  "Deliveroo":     "#ff5c6a",
  "GrubHub":       "#ffc542",
  "Other":         "#4a6080",
};
const getPartnerColor = (name, i) => CHART_PARTNER_COLORS[name] || PARTNER_COLORS[i % PARTNER_COLORS.length];

// ─── Sample Data ──────────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  {id:"P001",partner:"Uber Eats",    product:"Photo Session", country:"USA",      numImages:120,month:"2024-01",revenue:{deliverablesApproved:1800,additionalDeliverables:300, lastMinuteReschedule:0,  travel:250, other:0},expenses:{base:800, additionalDeliverables:150,lastMinuteReschedule:0,  travel:200,other:0}},
  {id:"P002",partner:"Uber Eats",    product:"Video Package", country:"USA",      numImages:60, month:"2024-01",revenue:{deliverablesApproved:2800,additionalDeliverables:0,   lastMinuteReschedule:350,travel:450, other:0},expenses:{base:1200,additionalDeliverables:0,  lastMinuteReschedule:200,travel:400,other:0}},
  {id:"P003",partner:"Deliveroo",    product:"Photo Session", country:"Canada",   numImages:200,month:"2024-02",revenue:{deliverablesApproved:2500,additionalDeliverables:400, lastMinuteReschedule:0,  travel:350, other:0},expenses:{base:1100,additionalDeliverables:200,lastMinuteReschedule:0,  travel:300,other:0}},
  {id:"P004",partner:"Deliveroo",    product:"Drone Footage", country:"Canada",   numImages:80, month:"2024-02",revenue:{deliverablesApproved:2200,additionalDeliverables:200, lastMinuteReschedule:0,  travel:550, other:0},expenses:{base:900, additionalDeliverables:100,lastMinuteReschedule:0,  travel:500,other:0}},
  {id:"P005",partner:"Uber Eats ANZ",product:"Photo Session", country:"UK",       numImages:150,month:"2024-03",revenue:{deliverablesApproved:2100,additionalDeliverables:0,   lastMinuteReschedule:450,travel:650, other:0},expenses:{base:950, additionalDeliverables:0,  lastMinuteReschedule:300,travel:600,other:0}},
  {id:"P006",partner:"Uber Eats ANZ",product:"Video Package", country:"UK",       numImages:90, month:"2024-03",revenue:{deliverablesApproved:3200,additionalDeliverables:500, lastMinuteReschedule:0,  travel:780, other:0},expenses:{base:1500,additionalDeliverables:300,lastMinuteReschedule:0,  travel:700,other:0}},
  {id:"P007",partner:"GrubHub",     product:"Drone Footage", country:"Australia",numImages:50, month:"2024-04",revenue:{deliverablesApproved:1900,additionalDeliverables:0,   lastMinuteReschedule:0,  travel:1300,other:0},expenses:{base:700, additionalDeliverables:0,  lastMinuteReschedule:0,  travel:1200,other:0}},
  {id:"P008",partner:"GrubHub",     product:"Photo Session", country:"Australia",numImages:180,month:"2024-04",revenue:{deliverablesApproved:2400,additionalDeliverables:450, lastMinuteReschedule:180,travel:1000,other:0},expenses:{base:1050,additionalDeliverables:250,lastMinuteReschedule:100,travel:900,other:0}},
  {id:"P009",partner:"Uber Eats",    product:"Photo Session", country:"USA",      numImages:135,month:"2024-05",revenue:{deliverablesApproved:1950,additionalDeliverables:220, lastMinuteReschedule:0,  travel:270, other:0},expenses:{base:850, additionalDeliverables:100,lastMinuteReschedule:0,  travel:220,other:0}},
  {id:"P010",partner:"Other Co",     product:"Video Package", country:"Canada",   numImages:75, month:"2024-05",revenue:{deliverablesApproved:3000,additionalDeliverables:300, lastMinuteReschedule:400,travel:400, other:0},expenses:{base:1300,additionalDeliverables:150,lastMinuteReschedule:250,travel:350,other:0}},
  {id:"P011",partner:"Deliveroo",    product:"Drone Footage", country:"France",   numImages:65, month:"2024-06",revenue:{deliverablesApproved:2000,additionalDeliverables:150, lastMinuteReschedule:0,  travel:900, other:0},expenses:{base:780, additionalDeliverables:80, lastMinuteReschedule:0,  travel:850,other:0}},
  {id:"P012",partner:"Random LLC",   product:"360 Tour",      country:"Germany",  numImages:200,month:"2024-06",revenue:{deliverablesApproved:3800,additionalDeliverables:700, lastMinuteReschedule:0,  travel:820, other:0},expenses:{base:1600,additionalDeliverables:400,lastMinuteReschedule:0,  travel:750,other:0}},
];

// ─── Keys & Labels ────────────────────────────────────────────────────────────
const EXP_KEYS   = ["base","additionalDeliverables","lastMinuteReschedule","travel","other"];
const REV_KEYS   = ["deliverablesApproved","additionalDeliverables","lastMinuteReschedule","travel","other"];
const EXP_LABELS = {base:"Base Amount",additionalDeliverables:"Additional Deliverables",lastMinuteReschedule:"Last Minute Reschedule",travel:"Travel",other:"Other"};
const REV_LABELS = {deliverablesApproved:"Deliverables Approved",additionalDeliverables:"Additional Deliverables",lastMinuteReschedule:"Last Minute Reschedule",travel:"Travel",other:"Other"};

const totalExp = p => {
  if (!p.expenses) return 0;
  return Object.values(p.expenses).reduce((s,v)=>s+(Number(v)||0),0);
};
const totalRev = p => {
  if (!p.revenue) return 0;
  return Object.values(p.revenue).reduce((s,v)=>s+(Number(v)||0),0);
};
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
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtMonth = m => {
  if (!m||m==="Unknown") return m||"?";
  const [y,mo]=m.split("-");
  return `${MONTH_NAMES[+mo-1]} ${y}`;
};
const metricColor = v => v>=40?C.accent:v>=25?C.yellow:C.red;

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const ChartTooltip = ({active,payload,label,valueFormatter=fmt})=>{
  if(!active||!payload?.length) return null;
  const visible = payload.filter(e=>e.value!==0);
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",fontFamily:"'DM Sans',sans-serif",minWidth:180}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:8,fontFamily:"'Space Mono',monospace"}}>{label}</div>
      {visible.map((e,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:24,fontSize:13,marginBottom:3}}>
          <span style={{color:e.color,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:8,height:8,borderRadius:2,background:e.color,display:"inline-block"}}/>
            {e.name}
          </span>
          <span style={{color:C.text,fontWeight:600}}>{valueFormatter(e.value)}</span>
        </div>
      ))}
      {visible.length>1&&(
        <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:13}}>
          <span style={{color:C.muted}}>Total</span>
          <span style={{color:C.accent,fontWeight:700}}>{valueFormatter(visible.reduce((s,e)=>s+e.value,0))}</span>
        </div>
      )}
    </div>
  );
};

// ─── Chart 1: Revenue by Partner by Month ────────────────────────────────────
function RevenueByPartnerChart({projects, activePartner}){
  const partnerGroupFn = makePartnerGroupFn(activePartner);
  const chartPartners = makeChartPartners(activePartner);
  const months=[...new Set(projects.map(p=>p.month))].filter(Boolean).sort();
  const data=months.map(m=>{
    const row={month:fmtMonth(m)};
    chartPartners.forEach(pt=>{
      row[pt]=projects.filter(p=>p.month===m&&partnerGroupFn(p.partner)===pt).reduce((s,p)=>s+totalRev(p),0);
    });
    return row;
  });
  const active = chartPartners.filter(pt=>data.some(r=>r[pt]>0));
  return(
    <div style={S.chartCard}>
      <div style={S.chartHeader}>
        <div style={S.chartTitle}>Revenue by Partner</div>
        <div style={S.chartSub}>Monthly stacked breakdown</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}} barSize={Math.max(20, Math.min(60, Math.floor(600/Math.max(data.length,1))))}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>v>=1000?`$${v/1000}k`:`$${v}`} tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTooltip/>}/>
          <Legend wrapperStyle={{paddingTop:16,fontSize:12,fontFamily:"DM Sans"}} formatter={v=><span style={{color:C.text}}>{v}</span>}/>
          {active.map((pt,i)=><Bar key={pt} dataKey={pt} stackId="a" fill={getPartnerColor(pt,i)} radius={i===active.length-1?[4,4,0,0]:[0,0,0,0]}/>)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 2: Expense per Image by Product (top 10, grouped by partner) ─────────
function ExpensePerImageChart({projects}){
  // Count projects per product to find top 10
  const productCounts = {};
  const productPartner = {};
  // Only include products from the named chart partners
  projects.filter(p=>EXP_IMAGE_CHART_PARTNERS.includes(normalizePartner(p.partner))).forEach(p=>{
    productCounts[p.product]=(productCounts[p.product]||0)+1;
    productPartner[p.product]=p.partner;
  });
  const top10 = Object.entries(productCounts)
    .filter(([,count])=>count>=10)
    .sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k])=>k);

  // Sort top10 so same-partner products are grouped together
  top10.sort((a,b)=>{
    const pa=productPartner[a]||"", pb=productPartner[b]||"";
    return pa.localeCompare(pb)||a.localeCompare(b);
  });

  const data=top10.map(prod=>{
    const sub=projects.filter(p=>p.product===prod&&EXP_IMAGE_CHART_PARTNERS.includes(normalizePartner(p.partner)));
    const imgs=sub.reduce((s,p)=>s+Number(p.numImages),0);
    if(!imgs) return null;
    const core=sub.reduce((s,p)=>s+Number(p.expenses.base)+Number(p.expenses.additionalDeliverables),0);
    const vari=sub.reduce((s,p)=>s+Number(p.expenses.lastMinuteReschedule)+Number(p.expenses.travel)+Number(p.expenses.other),0);
    const partner=productPartner[prod]||"";
    return{product:prod,partner,label:`${prod}\n(${partner})`,"Core (Base + Add.Deliv.)":core/imgs,"Variable (LMR + Travel + Other)":vari/imgs};
  }).filter(Boolean);

  const CustomXTick = ({x,y,payload})=>{
    const item = data.find(d=>d.product===payload.value);
    const partner = item?.partner||"";
    return(
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={14} textAnchor="middle" fill={C.muted} fontSize={10} fontFamily="Space Mono">{payload.value}</text>
        <text x={0} y={0} dy={26} textAnchor="middle" fill={C.muted} fontSize={9} fontFamily="Space Mono" opacity={0.7}>{partner}</text>
      </g>
    );
  };

  return(
    <div style={{...S.chartCard, gridColumn:"1 / -1"}}>
      <div style={S.chartHeader}>
        <div style={S.chartTitle}>Expense per Image by Product</div>
        <div style={S.chartSub}>Top 10 products with ≥10 projects · grouped by partner · Core vs variable cost per image</div>
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} margin={{top:10,right:20,left:0,bottom:40}} barSize={Math.max(24,Math.min(80,Math.floor(700/Math.max(data.length,1))))}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="product" tick={<CustomXTick/>} axisLine={false} tickLine={false} interval={0}/>
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
function TravelExpenseChart({projects, activePartner}){
  const partnerGroupFn = makePartnerGroupFn(activePartner);
  const chartPartners = makeChartPartners(activePartner);
  const months=[...new Set(projects.map(p=>p.month))].filter(Boolean).sort();
  const data=months.map(m=>{
    const row={month:fmtMonth(m)};
    chartPartners.forEach(pt=>{
      row[pt]=projects.filter(p=>p.month===m&&partnerGroupFn(p.partner)===pt).reduce((s,p)=>s+(Number(p.expenses?.travel)||0),0);
    });
    return row;
  });
  const active = chartPartners.filter(pt=>data.some(r=>r[pt]>0));
  return(
    <div style={S.chartCard}>
      <div style={S.chartHeader}>
        <div style={S.chartTitle}>Travel Expenses by Partner</div>
        <div style={S.chartSub}>Monthly travel costs by partner</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}} barSize={Math.max(20, Math.min(60, Math.floor(600/Math.max(data.length,1))))}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>v>=1000?`$${v/1000}k`:`$${v}`} tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTooltip/>}/>
          <Legend wrapperStyle={{paddingTop:16,fontSize:12,fontFamily:"DM Sans"}} formatter={v=><span style={{color:C.text}}>{v}</span>}/>
          {active.map((pt,i)=><Bar key={pt} dataKey={pt} stackId="a" fill={getPartnerColor(pt,i)} radius={i===active.length-1?[3,3,0,0]:[0,0,0,0]}/>)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 4: Margin by Partner by Month ─────────────────────────────────────
function MarginByPartnerChart({projects, activePartner}){
  const partnerGroupFn = makePartnerGroupFn(activePartner);
  const chartPartners = makeChartPartners(activePartner);
  const months=[...new Set(projects.map(p=>p.month))].filter(Boolean).sort();
  const data=months.map(m=>{
    const row={month:fmtMonth(m)};
    chartPartners.forEach(pt=>{
      const sub=projects.filter(p=>p.month===m&&partnerGroupFn(p.partner)===pt);
      row[pt]=sub.reduce((s,p)=>s+totalRev(p)-totalExp(p),0);
    });
    return row;
  });
  const active = chartPartners.filter(pt=>data.some(r=>r[pt]!==0));
  return(
    <div style={S.chartCard}>
      <div style={S.chartHeader}>
        <div style={S.chartTitle}>Margin by Partner</div>
        <div style={S.chartSub}>Monthly revenue minus expenses by partner</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}} barSize={Math.max(20, Math.min(60, Math.floor(600/Math.max(data.length,1))))}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>v>=1000?`$${v/1000}k`:`$${v}`} tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTooltip/>}/>
          <Legend wrapperStyle={{paddingTop:16,fontSize:12,fontFamily:"DM Sans"}} formatter={v=><span style={{color:C.text}}>{v}</span>}/>
          {active.map((pt,i)=><Bar key={pt} dataKey={pt} stackId="a" fill={getPartnerColor(pt,i)} radius={i===active.length-1?[4,4,0,0]:[0,0,0,0]}/>)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Hardcoded Sheet URL ────────────────────────────────────────────
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1JmvTv2QP1INdgvLIAoYBlnevvQKDmvnjsDxHyjQPTPg/edit";

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
  const [groupBy,setGroupBy]=useState("partner");
  const [lastSync,setLastSync]=useState(null);
  const [syncing,setSyncing]=useState(false);
  const [syncError,setSyncError]=useState(null);

  const syncSheets=async()=>{
    setSyncing(true);setSyncError(null);
    try{
      const res=await fetch("/api/sheets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sheetUrl:SHEET_URL})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Unknown error");
      handleImport(data.projects);
    }catch(e){setSyncError(e.message);}
    finally{setSyncing(false);}
  };
  // Auto-sync on first load
  useEffect(()=>{syncSheets();},[]);
  // Default date range: 7 months ago → prior month
  const defaultDates = useMemo(()=>{
    const now = new Date();
    const toDate = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const fromDate = new Date(now.getFullYear(), now.getMonth()-8, 1);
    const toStr = `${toDate.getFullYear()}-${String(toDate.getMonth()+1).padStart(2,"0")}`;
    const fromStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth()+1).padStart(2,"0")}`;
    return {from: fromStr, to: toStr};
  },[]);
  const [filters,setFilters]=useState({partner:"All",product:"All",country:"All",dateFrom:defaultDates.from,dateTo:defaultDates.to});
  const setFilter=(k,v)=>setFilters(f=>({...f,[k]:v}));

  // Build filter options: alpha-sorted; country puts USA first
  // Product and Country are filtered to match selected Partner
  const options=k=>{
    const source = (k==="product"||k==="country") && filters.partner!=="All"
      ? projects.filter(p=>p.partner===filters.partner)
      : projects;
    const vals=[...new Set(source.map(p=>p[k]))].filter(Boolean).sort((a,b)=>a.localeCompare(b));
    if(k==="country"){
      const usFirst=vals.filter(v=>v==="USA");
      const rest=vals.filter(v=>v!=="USA");
      return ["All",...usFirst,...rest];
    }
    return ["All",...vals];
  };

  // Reset product/country if they're no longer valid for the selected partner
  useEffect(()=>{
    if(filters.partner==="All") return;
    const validProducts=new Set(projects.filter(p=>p.partner===filters.partner).map(p=>p.product));
    const validCountries=new Set(projects.filter(p=>p.partner===filters.partner).map(p=>p.country));
    if(filters.product!=="All"&&!validProducts.has(filters.product)) setFilter("product","All");
    if(filters.country!=="All"&&!validCountries.has(filters.country)) setFilter("country","All");
  },[filters.partner, projects]);

  // All months available for date pickers
  const allMonths=useMemo(()=>{
    const fromData=[...new Set(projects.map(p=>p.month))].filter(Boolean);
    // Include default dates so they always appear as options even before data loads
    const merged=[...new Set([...fromData, defaultDates.from, defaultDates.to])].filter(Boolean).sort();
    return merged;
  },[projects, defaultDates]);

  const filtered=useMemo(()=>projects.filter(p=>{
    if(filters.partner!=="All"&&p.partner!==filters.partner) return false;
    if(filters.product!=="All"&&p.product!==filters.product) return false;
    if(filters.country!=="All"&&p.country!==filters.country) return false;
    // Exclude projects with no valid month when a date filter is active
    const hasDateFilter=filters.dateFrom||filters.dateTo;
    const validMonth=p.month&&p.month!=="Unknown"&&/^\d{4}-\d{2}$/.test(p.month);
    if(hasDateFilter&&!validMonth) return false;
    if(filters.dateFrom&&validMonth&&p.month<filters.dateFrom) return false;
    if(filters.dateTo&&validMonth&&p.month>filters.dateTo) return false;
    return true;
  }),[projects,filters]);

  const totals=useMemo(()=>filtered.reduce((a,p)=>{
    const t=calcTotals(p);return{rev:a.rev+t.totalRevenue,exp:a.exp+t.totalExpenses,imgs:a.imgs+(Number(p.numImages)||0)};
  },{rev:0,exp:0,imgs:0}),[filtered]);

  // Rev/Image and Exp/Image only count the specified named partners
  const imgTotals=useMemo(()=>filtered.filter(p=>IMAGE_METRIC_PARTNERS.includes(normalizePartner(p.partner))).reduce((a,p)=>{
    const t=calcTotals(p);return{rev:a.rev+t.totalRevenue,exp:a.exp+t.totalExpenses,imgs:a.imgs+(Number(p.numImages)||0)};
  },{rev:0,exp:0,imgs:0}),[filtered]);

  const margin=totals.rev-totals.exp,marginPct=totals.rev>0?(margin/totals.rev)*100:0;
  const hasFilters=filters.partner!=="All"||filters.product!=="All"||filters.country!=="All"||(filters.dateFrom&&filters.dateFrom!==defaultDates.from)||(filters.dateTo&&filters.dateTo!==defaultDates.to);

  const handleImport=rows=>{
    // Normalize partner names on import to fix case inconsistencies (e.g. Grubhub → GrubHub)
    const normalized = rows.map(p=>({...p, partner: normalizePartner(p.partner)}));
    setProjects(normalized);
    setLastSync(new Date().toLocaleTimeString());
  };
  const deleteProject=id=>setProjects(prev=>prev.filter(p=>p.id!==id));

  const navBtn=(label,key)=>(
    <button onClick={()=>setView(key)} style={{background:view===key?`${C.accent}15`:"transparent",color:view===key?C.accent:C.muted,border:"none",borderRadius:8,padding:"8px 18px",fontWeight:view===key?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,transition:"all 0.2s"}}>
      {label}
    </button>
  );

  const sel={background:C.card,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"7px 12px",fontSize:12,fontFamily:"'Space Mono',monospace",cursor:"pointer",outline:"none"};
  const dateInp={...sel,fontFamily:"'Space Mono',monospace",padding:"7px 10px"};

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
          <div style={{width:1,height:20,background:C.border,margin:"0 8px"}}/>
          <button onClick={syncSheets} disabled={syncing} style={{background:`${C.purple}20`,color:C.purple,border:`1px solid ${C.purple}40`,borderRadius:8,padding:"7px 16px",fontWeight:600,cursor:syncing?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,display:"flex",alignItems:"center",gap:6,opacity:syncing?0.7:1}}>
            <span style={{display:"inline-block",animation:syncing?"spin 1s linear infinite":"none"}}>⟳</span>
            {syncing?"Syncing…":"Sync Sheets"}
            {lastSync&&!syncing&&<span style={{fontSize:10,opacity:0.7}}>{lastSync}</span>}
          </button>
        </div>
      </div>

      <div style={{padding:"24px 28px",maxWidth:1280,margin:"0 auto"}}>

        {/* ── Filter Bar ── */}
        {["dashboard","charts","projects"].includes(view)&&(
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 16px",marginBottom:22,display:"flex",gap:8,alignItems:"center",flexWrap:"nowrap",overflowX:"auto"}}>
            {/* Partner */}
            <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
              <span style={{fontSize:9,color:C.muted,fontFamily:"'Space Mono',monospace",letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>Partner</span>
              <select style={{...sel,padding:"5px 8px",fontSize:11}} value={filters.partner} onChange={e=>setFilter("partner",e.target.value)}>
                {options("partner").map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            {/* Product */}
            <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0,flex:1}}>
              <span style={{fontSize:9,color:C.muted,fontFamily:"'Space Mono',monospace",letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>Product</span>
              <select style={{...sel,padding:"5px 8px",fontSize:11,width:"100%"}} value={filters.product} onChange={e=>setFilter("product",e.target.value)}>
                {options("product").map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            {/* Country */}
            <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
              <span style={{fontSize:9,color:C.muted,fontFamily:"'Space Mono',monospace",letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>Country</span>
              <select style={{...sel,padding:"5px 8px",fontSize:11}} value={filters.country} onChange={e=>setFilter("country",e.target.value)}>
                {options("country").map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div style={{width:1,height:32,background:C.border,flexShrink:0}}/>
            {/* Date range */}
            <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
              <span style={{fontSize:9,color:C.muted,fontFamily:"'Space Mono',monospace",letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>From</span>
              <select style={{...sel,padding:"5px 8px",fontSize:11}} value={filters.dateFrom} onChange={e=>setFilter("dateFrom",e.target.value)}>
                <option value="">From…</option>
                {allMonths.map(m=><option key={m} value={m}>{fmtMonth(m)}</option>)}
              </select>
            </div>
            <span style={{color:C.muted,fontSize:11,flexShrink:0,marginTop:14}}>→</span>
            <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
              <span style={{fontSize:9,color:C.muted,fontFamily:"'Space Mono',monospace",letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>To</span>
              <select style={{...sel,padding:"5px 8px",fontSize:11}} value={filters.dateTo} onChange={e=>setFilter("dateTo",e.target.value)}>
                <option value="">To…</option>
                {allMonths.map(m=><option key={m} value={m}>{fmtMonth(m)}</option>)}
              </select>
            </div>
            {hasFilters&&(
              <button onClick={()=>setFilters({partner:"All",product:"All",country:"All",dateFrom:defaultDates.from,dateTo:defaultDates.to})}
                style={{background:"transparent",color:C.red,border:"none",cursor:"pointer",fontSize:11,fontFamily:"'Space Mono',monospace",flexShrink:0,marginTop:14,whiteSpace:"nowrap"}}>
                Clear ×
              </button>
            )}
            <span style={{marginLeft:"auto",fontSize:11,color:C.muted,fontFamily:"'Space Mono',monospace",flexShrink:0,whiteSpace:"nowrap",marginTop:14}}>{filtered.length} / {projects.length}</span>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {view==="dashboard"&&(<>
          <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
            {[
              ["Total Revenue",   fmt(totals.rev),  C.accent, `${filtered.length.toLocaleString("en-US")} projects`],
              ["Total Expenses",  fmt(totals.exp),  C.red,    null],
              ["Gross Margin",    fmt(margin),      metricColor(marginPct), fmtP(marginPct)],
              ["Margin %",        fmtP(marginPct),  metricColor(marginPct), marginPct>=40?"✓ Healthy":marginPct>=25?"⚠ Watch":"✗ Low"],
              ["Revenue / Image", fmtD(imgTotals.imgs>0?imgTotals.rev/imgTotals.imgs:0), C.purple, `${Math.round(imgTotals.imgs).toLocaleString("en-US")} images`],
              ["Expense / Image", fmtD(imgTotals.imgs>0?imgTotals.exp/imgTotals.imgs:0), C.yellow, `named partners only`],
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
            <RevenueByPartnerChart projects={filtered} activePartner={filters.partner}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <MarginByPartnerChart projects={filtered} activePartner={filters.partner}/>
              <TravelExpenseChart projects={filtered} activePartner={filters.partner}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:20}}>
              <ExpensePerImageChart projects={filtered}/>
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
                        {[p.product,p.country,fmtMonth(p.month),p.id,`${p.numImages} imgs`].map((tag,i)=>(
                          <span key={i} style={{fontSize:11,background:C.bg,color:C.muted,borderRadius:4,padding:"2px 8px",fontFamily:"'Space Mono',monospace"}}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={()=>deleteProject(p.id)} style={{background:"transparent",color:C.red,border:`1px solid ${C.red}40`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12}}>Remove</button>
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
                            <span style={{color:C.muted}}>{labels[k]}</span>
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

      {syncError&&<div style={{position:"fixed",bottom:24,right:24,background:C.card,border:`1px solid ${C.red}`,borderRadius:10,padding:"12px 18px",color:C.red,fontSize:13,fontFamily:"'Space Mono',monospace",zIndex:100,maxWidth:360}}>⚠ Sync error: {syncError} <button onClick={()=>setSyncError(null)} style={{marginLeft:12,background:"transparent",border:"none",color:C.muted,cursor:"pointer"}}>×</button></div>}
    </div>
  );
}