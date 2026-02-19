import { useState, useMemo, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from "recharts";

// ─── Palette ───────────────────────────────────────────────────────────────
const C = {
  bg: "#080c14",
  surface: "#0f1623",
  card: "#131d2e",
  border: "#1c2a3d",
  borderHover: "#2a3f5a",
  text: "#dce8f5",
  muted: "#4a6080",
  accent: "#00d9c0",
  accentDim: "#00d9c015",
  red: "#ff5c6a",
  yellow: "#ffc542",
  purple: "#9b7fe8",
  blue: "#4da6ff",
  green: "#00d9c0",
};

const PARTNER_COLORS = ["#00d9c0","#9b7fe8","#ff5c6a","#ffc542","#4da6ff","#ff9d5c","#80e882"];
const PRODUCT_COLORS_MAP = { "Photo Session": "#00d9c0", "Video Package": "#9b7fe8", "Drone Footage": "#ff5c6a", "360 Tour": "#ffc542" };

// ─── Sample Data ────────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  { id:1,  partner:"Acme Corp",    product:"Photo Session", country:"USA",       numImages:120, month:"2024-01", expenses:{base:800,  additionalDeliverables:150, lastMinuteReschedule:0,   travelOther:200}, revenue:{deliverablesApproved:1800, additionalDeliverables:300, lastMinuteReschedule:0,   travelOther:250}},
  { id:2,  partner:"Acme Corp",    product:"Video Package", country:"USA",       numImages:60,  month:"2024-01", expenses:{base:1200, additionalDeliverables:0,   lastMinuteReschedule:200, travelOther:400}, revenue:{deliverablesApproved:2800, additionalDeliverables:0,   lastMinuteReschedule:350, travelOther:450}},
  { id:3,  partner:"Blue Wave",    product:"Photo Session", country:"Canada",    numImages:200, month:"2024-02", expenses:{base:1100, additionalDeliverables:200, lastMinuteReschedule:0,   travelOther:300}, revenue:{deliverablesApproved:2500, additionalDeliverables:400, lastMinuteReschedule:0,   travelOther:350}},
  { id:4,  partner:"Blue Wave",    product:"Drone Footage", country:"Canada",    numImages:80,  month:"2024-02", expenses:{base:900,  additionalDeliverables:100, lastMinuteReschedule:0,   travelOther:500}, revenue:{deliverablesApproved:2200, additionalDeliverables:200, lastMinuteReschedule:0,   travelOther:550}},
  { id:5,  partner:"Stellar Inc",  product:"Photo Session", country:"UK",        numImages:150, month:"2024-03", expenses:{base:950,  additionalDeliverables:0,   lastMinuteReschedule:300, travelOther:600}, revenue:{deliverablesApproved:2100, additionalDeliverables:0,   lastMinuteReschedule:450, travelOther:650}},
  { id:6,  partner:"Stellar Inc",  product:"Video Package", country:"UK",        numImages:90,  month:"2024-03", expenses:{base:1500, additionalDeliverables:300, lastMinuteReschedule:0,   travelOther:700}, revenue:{deliverablesApproved:3200, additionalDeliverables:500, lastMinuteReschedule:0,   travelOther:780}},
  { id:7,  partner:"Nexus Media",  product:"Drone Footage", country:"Australia", numImages:50,  month:"2024-04", expenses:{base:700,  additionalDeliverables:0,   lastMinuteReschedule:0,   travelOther:1200},revenue:{deliverablesApproved:1900, additionalDeliverables:0,   lastMinuteReschedule:0,   travelOther:1300}},
  { id:8,  partner:"Nexus Media",  product:"Photo Session", country:"Australia", numImages:180, month:"2024-04", expenses:{base:1050, additionalDeliverables:250, lastMinuteReschedule:100, travelOther:900}, revenue:{deliverablesApproved:2400, additionalDeliverables:450, lastMinuteReschedule:180, travelOther:1000}},
  { id:9,  partner:"Acme Corp",    product:"Photo Session", country:"USA",       numImages:135, month:"2024-05", expenses:{base:850,  additionalDeliverables:100, lastMinuteReschedule:0,   travelOther:220}, revenue:{deliverablesApproved:1950, additionalDeliverables:220, lastMinuteReschedule:0,   travelOther:270}},
  { id:10, partner:"Blue Wave",    product:"Video Package", country:"Canada",    numImages:75,  month:"2024-05", expenses:{base:1300, additionalDeliverables:150, lastMinuteReschedule:250, travelOther:350}, revenue:{deliverablesApproved:3000, additionalDeliverables:300, lastMinuteReschedule:400, travelOther:400}},
  { id:11, partner:"Stellar Inc",  product:"Drone Footage", country:"France",    numImages:65,  month:"2024-06", expenses:{base:780,  additionalDeliverables:80,  lastMinuteReschedule:0,   travelOther:850}, revenue:{deliverablesApproved:2000, additionalDeliverables:150, lastMinuteReschedule:0,   travelOther:900}},
  { id:12, partner:"Nexus Media",  product:"360 Tour",      country:"Germany",   numImages:200, month:"2024-06", expenses:{base:1600, additionalDeliverables:400, lastMinuteReschedule:0,   travelOther:750}, revenue:{deliverablesApproved:3800, additionalDeliverables:700, lastMinuteReschedule:0,   travelOther:820}},
];

// ─── Utils ───────────────────────────────────────────────────────────────────
const EXP_KEYS  = ["base","additionalDeliverables","lastMinuteReschedule","travelOther"];
const REV_KEYS  = ["deliverablesApproved","additionalDeliverables","lastMinuteReschedule","travelOther"];
const EXP_LABELS = {base:"Base Amount", additionalDeliverables:"Additional Deliverables", lastMinuteReschedule:"Last Minute Reschedule", travelOther:"Travel & Other"};
const REV_LABELS = {deliverablesApproved:"Deliverables Approved", additionalDeliverables:"Additional Deliverables", lastMinuteReschedule:"Last Minute Reschedule", travelOther:"Travel & Other"};

const totalExp = p => EXP_KEYS.reduce((s,k)=>s+(p.expenses[k]||0),0);
const totalRev = p => REV_KEYS.reduce((s,k)=>s+(p.revenue[k]||0),0);
const calcTotals = p => {
  const te=totalExp(p), tr=totalRev(p), m=tr-te;
  return { totalExpenses:te, totalRevenue:tr, margin:m,
    marginPct: tr>0?(m/tr)*100:0,
    revenuePerImage: p.numImages>0?tr/p.numImages:0,
    expensePerImage: p.numImages>0?te/p.numImages:0 };
};

const fmt  = n => `$${Math.round(n).toLocaleString("en-US")}`;
const fmtD = n => `$${n.toFixed(2)}`;
const fmtP = n => `${n.toFixed(1)}%`;

const MONTHS_ORDER = ["2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12"];
const fmtMonth = m => { const [y,mo]=m.split("-"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+mo-1]} ${y}`; };

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, valueFormatter=fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",fontFamily:"'DM Sans',sans-serif",minWidth:180}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:8,fontFamily:"'Space Mono',monospace"}}>{label}</div>
      {payload.map((entry,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:24,fontSize:13,marginBottom:3}}>
          <span style={{color:entry.color,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:8,height:8,borderRadius:2,background:entry.color,display:"inline-block"}}/>
            {entry.name}
          </span>
          <span style={{color:C.text,fontWeight:600}}>{valueFormatter(entry.value)}</span>
        </div>
      ))}
      {payload.length>1 && (
        <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:13}}>
          <span style={{color:C.muted}}>Total</span>
          <span style={{color:C.accent,fontWeight:700}}>{valueFormatter(payload.reduce((s,e)=>s+e.value,0))}</span>
        </div>
      )}
    </div>
  );
};

// ─── Chart 1: Revenue by Partner by Month ────────────────────────────────────
function RevenueByPartnerChart({ projects }) {
  const partners = [...new Set(projects.map(p=>p.partner))];
  const months = [...new Set(projects.map(p=>p.month))].sort();

  const data = months.map(m => {
    const row = { month: fmtMonth(m) };
    partners.forEach(partner => {
      row[partner] = projects.filter(p=>p.month===m && p.partner===partner).reduce((s,p)=>s+totalRev(p),0);
    });
    return row;
  });

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartHeader}>
        <div>
          <div style={styles.chartTitle}>Revenue by Partner</div>
          <div style={styles.chartSub}>Monthly stacked breakdown</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>v>=1000?`$${v/1000}k`:`$${v}`} tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTooltip/>}/>
          <Legend wrapperStyle={{paddingTop:16,fontSize:12,fontFamily:"DM Sans"}}
            formatter={(val)=><span style={{color:C.text}}>{val}</span>}/>
          {partners.map((partner,i)=>(
            <Bar key={partner} dataKey={partner} stackId="a" fill={PARTNER_COLORS[i % PARTNER_COLORS.length]}
              radius={i===partners.length-1?[4,4,0,0]:[0,0,0,0]}/>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 2: Expense per Image by Product ───────────────────────────────────
function ExpensePerImageChart({ projects }) {
  const products = [...new Set(projects.map(p=>p.product))];

  const data = products.map(product => {
    const subset = projects.filter(p=>p.product===product);
    const totalImgs = subset.reduce((s,p)=>s+p.numImages,0);
    if (!totalImgs) return null;
    const coreExp = subset.reduce((s,p)=>s+p.expenses.base+p.expenses.additionalDeliverables,0);
    const varExp  = subset.reduce((s,p)=>s+p.expenses.lastMinuteReschedule+p.expenses.travelOther,0);
    return { product, "Core (Base + Add.Deliv.)": coreExp/totalImgs, "Variable (LMR + Travel)": varExp/totalImgs };
  }).filter(Boolean);

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartHeader}>
        <div>
          <div style={styles.chartTitle}>Expense per Image by Product</div>
          <div style={styles.chartSub}>Core vs variable cost per image</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="product" tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>`$${v.toFixed(1)}`} tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTooltip valueFormatter={fmtD}/>}/>
          <Legend wrapperStyle={{paddingTop:16,fontSize:12,fontFamily:"DM Sans"}}
            formatter={(val)=><span style={{color:C.text}}>{val}</span>}/>
          <Bar dataKey="Core (Base + Add.Deliv.)" stackId="a" fill={C.accent} radius={[0,0,0,0]}/>
          <Bar dataKey="Variable (LMR + Travel)" stackId="a" fill={C.yellow} radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 3: Travel Expenses per Partner by Month ───────────────────────────
function TravelExpenseChart({ projects }) {
  const months = [...new Set(projects.map(p=>p.month))].sort();
  const partners = [...new Set(projects.map(p=>p.partner))];
  const data = months.map(m => {
    const row = { month: fmtMonth(m) };
    partners.forEach(partner => {
      row[partner] = projects.filter(p=>p.month===m && p.partner===partner).reduce((s,p)=>s+p.expenses.travelOther,0);
    });
    return row;
  });

  const allKeys = partners;

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartHeader}>
        <div>
          <div style={styles.chartTitle}>Travel Expenses by Partner</div>
          <div style={styles.chartSub}>Monthly travel & other costs by partner</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>v>=1000?`$${v/1000}k`:`$${v}`} tick={{fill:C.muted,fontSize:11,fontFamily:"Space Mono"}} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTooltip/>}/>
          <Legend wrapperStyle={{paddingTop:16,fontSize:11,fontFamily:"DM Sans"}}
            formatter={(val)=><span style={{color:C.text}}>{val}</span>}/>
          {allKeys.map((key,i)=>(
            <Bar key={key} dataKey={key} stackId="a" fill={PARTNER_COLORS[i % PARTNER_COLORS.length]}
              radius={i===allKeys.length-1?[3,3,0,0]:[0,0,0,0]}/>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Data Sources Panel ──────────────────────────────────────────────────────
function DataSourcePanel({ onImport, onClose }) {
  const [tab, setTab] = useState("csv");
  const [csvText, setCsvText] = useState("");
  const [gsUrl, setGsUrl] = useState("");
  const [sqlConn, setSqlConn] = useState({ host:"", db:"", user:"", pass:"", query:"SELECT * FROM projects" });
  const [status, setStatus] = useState(null);
  const fileRef = useRef();

  const parseCSV = (text) => {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""));
    return lines.slice(1).map((line,i) => {
      const vals = line.split(",").map(v=>v.trim().replace(/^"|"$/g,""));
      const obj = {};
      headers.forEach((h,j)=>obj[h]=vals[j]||"");
      return {
        id: Date.now()+i,
        partner: obj.partner||"Unknown",
        product: obj.product||"Unknown",
        country: obj.country||"Unknown",
        numImages: Number(obj.numImages||obj.num_images||0),
        month: obj.month||"2024-01",
        expenses:{
          base: Number(obj.exp_base||obj["expenses.base"]||0),
          additionalDeliverables: Number(obj.exp_add_deliv||obj["expenses.additionalDeliverables"]||0),
          lastMinuteReschedule: Number(obj.exp_lmr||obj["expenses.lastMinuteReschedule"]||0),
          travelOther: Number(obj.exp_travel||obj["expenses.travelOther"]||0),
        },
        revenue:{
          deliverablesApproved: Number(obj.rev_approved||obj["revenue.deliverablesApproved"]||0),
          additionalDeliverables: Number(obj.rev_add_deliv||obj["revenue.additionalDeliverables"]||0),
          lastMinuteReschedule: Number(obj.rev_lmr||obj["revenue.lastMinuteReschedule"]||0),
          travelOther: Number(obj.rev_travel||obj["revenue.travelOther"]||0),
        }
      };
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvText(ev.target.result);
    reader.readAsText(file);
  };

  const handleCSVImport = () => {
    try {
      const parsed = parseCSV(csvText);
      if (!parsed.length) { setStatus({type:"error",msg:"No rows parsed. Check CSV format."}); return; }
      onImport(parsed);
      setStatus({type:"success",msg:`✓ Imported ${parsed.length} projects`});
    } catch(e) { setStatus({type:"error",msg:"Parse error: "+e.message}); }
  };

  const handleGSConnect = () => {
    if (!gsUrl.includes("docs.google.com")) { setStatus({type:"error",msg:"Please enter a valid Google Sheets URL."}); return; }
    setStatus({type:"loading",msg:"Connecting to Google Sheets…"});
    setTimeout(()=>setStatus({type:"info",msg:"In production: provide OAuth credentials and use the Sheets API (sheets.googleapis.com/v4/spreadsheets). Mock connection successful — replace with real API call."}),1200);
  };

  const handleSQLConnect = () => {
    if (!sqlConn.host || !sqlConn.db) { setStatus({type:"error",msg:"Host and database are required."}); return; }
    setStatus({type:"loading",msg:"Connecting to database…"});
    setTimeout(()=>setStatus({type:"info",msg:"In production: route this through your backend API (e.g. POST /api/query). Direct browser→SQL is not supported for security reasons. Mock connection successful."}),1400);
  };

  const tabBtn = (key,label) => (
    <button onClick={()=>{setTab(key);setStatus(null);}} style={{
      padding:"8px 20px", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600,
      borderBottom: tab===key?`2px solid ${C.accent}`:"2px solid transparent",
      background:"transparent", color: tab===key?C.accent:C.muted, transition:"all 0.2s"
    }}>{label}</button>
  );

  const inp = { background:C.bg, border:`1px solid ${C.border}`, borderRadius:7, color:C.text, padding:"9px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", width:"100%", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(4,8,18,0.88)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,width:560,maxHeight:"85vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
        <div style={{padding:"24px 28px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:18,color:C.text,fontFamily:"'DM Sans',sans-serif"}}>Import Data</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2,fontFamily:"'Space Mono',monospace"}}>Connect to a data source</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"16px 28px 0",display:"flex",borderBottom:`1px solid ${C.border}`,gap:0}}>
          {tabBtn("csv","📄 CSV")}
          {tabBtn("gsheets","📊 Google Sheets")}
          {tabBtn("sql","🗄️ SQL")}
        </div>
        <div style={{padding:28}}>
          {tab==="csv" && (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{fontSize:12,color:C.muted,fontFamily:"'Space Mono',monospace",lineHeight:1.6,background:C.bg,padding:12,borderRadius:8,border:`1px solid ${C.border}`}}>
                Expected columns: <span style={{color:C.accent}}>partner, product, country, numImages, month (YYYY-MM), exp_base, exp_add_deliv, exp_lmr, exp_travel, rev_approved, rev_add_deliv, rev_lmr, rev_travel</span>
              </div>
              <button onClick={()=>fileRef.current.click()} style={{background:C.accentDim,border:`1px dashed ${C.accent}`,borderRadius:8,padding:"12px",color:C.accent,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600}}>
                📂 Upload CSV File
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleFileUpload}/>
              <textarea value={csvText} onChange={e=>setCsvText(e.target.value)}
                placeholder="Or paste CSV content here…"
                style={{...inp,height:160,resize:"vertical",fontFamily:"'Space Mono',monospace",fontSize:11,lineHeight:1.6}}/>
              <button onClick={handleCSVImport} style={styles.primaryBtn}>Import CSV</button>
            </div>
          )}
          {tab==="gsheets" && (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{fontSize:12,color:C.muted,fontFamily:"'Space Mono',monospace",lineHeight:1.6,background:C.bg,padding:12,borderRadius:8,border:`1px solid ${C.border}`}}>
                Share your sheet (Anyone with link → Viewer), then paste the URL below. Production setup requires Google OAuth 2.0 + Sheets API v4.
              </div>
              <div>
                <label style={styles.label}>Google Sheets URL</label>
                <input style={inp} value={gsUrl} onChange={e=>setGsUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..."/>
              </div>
              <div>
                <label style={styles.label}>Sheet / Tab Name</label>
                <input style={inp} defaultValue="Sheet1" placeholder="Sheet1"/>
              </div>
              <div>
                <label style={styles.label}>Header Row</label>
                <input style={{...inp,width:80}} defaultValue="1"/>
              </div>
              <button onClick={handleGSConnect} style={styles.primaryBtn}>Connect Google Sheets</button>
              <div style={{fontSize:11,color:C.muted,fontFamily:"'Space Mono',monospace",textAlign:"center"}}>
                Requires Sheets API credentials in backend config
              </div>
            </div>
          )}
          {tab==="sql" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:12,color:C.muted,fontFamily:"'Space Mono',monospace",lineHeight:1.6,background:C.bg,padding:12,borderRadius:8,border:`1px solid ${C.border}`}}>
                SQL connections must route through your backend API for security. Configure your server to proxy queries.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={styles.label}>Host</label><input style={inp} value={sqlConn.host} onChange={e=>setSqlConn(s=>({...s,host:e.target.value}))} placeholder="db.example.com"/></div>
                <div><label style={styles.label}>Database</label><input style={inp} value={sqlConn.db} onChange={e=>setSqlConn(s=>({...s,db:e.target.value}))} placeholder="analytics"/></div>
                <div><label style={styles.label}>Username</label><input style={inp} value={sqlConn.user} onChange={e=>setSqlConn(s=>({...s,user:e.target.value}))} placeholder="readonly_user"/></div>
                <div><label style={styles.label}>Password</label><input style={{...inp}} type="password" value={sqlConn.pass} onChange={e=>setSqlConn(s=>({...s,pass:e.target.value}))} placeholder="••••••••"/></div>
              </div>
              <div>
                <label style={styles.label}>Query</label>
                <textarea value={sqlConn.query} onChange={e=>setSqlConn(s=>({...s,query:e.target.value}))}
                  style={{...inp,height:90,resize:"vertical",fontFamily:"'Space Mono',monospace",fontSize:12}}/>
              </div>
              <button onClick={handleSQLConnect} style={styles.primaryBtn}>Connect & Run Query</button>
            </div>
          )}
          {status && (
            <div style={{marginTop:14,padding:"10px 14px",borderRadius:8,border:`1px solid ${status.type==="error"?C.red:status.type==="success"?C.green:C.border}`,
              background:status.type==="error"?`${C.red}15`:status.type==="success"?`${C.green}15`:C.bg,
              color:status.type==="error"?C.red:status.type==="success"?C.green:C.muted,
              fontSize:12,fontFamily:"'Space Mono',monospace",lineHeight:1.6}}>
              {status.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Project Form ────────────────────────────────────────────────────────────
const emptyProject = ()=>({
  partner:"",product:"",country:"",numImages:"",month:"2024-01",
  expenses:{base:"",additionalDeliverables:"",lastMinuteReschedule:"",travelOther:""},
  revenue:{deliverablesApproved:"",additionalDeliverables:"",lastMinuteReschedule:"",travelOther:""},
});

function ProjectForm({ onSave, onCancel, initial }) {
  const [form,setForm]=useState(initial||emptyProject());
  const set=(f,v)=>setForm(p=>({...p,[f]:v}));
  const setExp=(k,v)=>setForm(p=>({...p,expenses:{...p.expenses,[k]:v}}));
  const setRev=(k,v)=>setForm(p=>({...p,revenue:{...p.revenue,[k]:v}}));
  const inp={background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"8px 12px",fontSize:13,fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none",width:"100%"};
  const handleSave=()=>{
    if(!form.partner||!form.product||!form.country){alert("Partner, Product, Country required.");return;}
    onSave({...form,numImages:Number(form.numImages)||0,
      expenses:Object.fromEntries(EXP_KEYS.map(k=>[k,Number(form.expenses[k])||0])),
      revenue:Object.fromEntries(REV_KEYS.map(k=>[k,Number(form.revenue[k])||0]))});
  };
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:28}}>
      <h3 style={{margin:"0 0 20px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:18}}>{initial?"Edit Project":"New Project"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12,marginBottom:22}}>
        {[["partner","Partner"],["product","Product"],["country","Country"],["numImages","# Images"],["month","Month (YYYY-MM)"]].map(([f,l])=>(
          <div key={f}><label style={styles.label}>{l}</label><input style={inp} value={form[f]} onChange={e=>set(f,e.target.value)} placeholder={l}/></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        <div>
          <div style={{...styles.label,color:C.red,marginBottom:12}}>EXPENSES ($)</div>
          {EXP_KEYS.map(k=><div key={k} style={{marginBottom:10}}><label style={styles.label}>{EXP_LABELS[k]}</label><input style={inp} type="number" value={form.expenses[k]} onChange={e=>setExp(k,e.target.value)} placeholder="0"/></div>)}
        </div>
        <div>
          <div style={{...styles.label,color:C.accent,marginBottom:12}}>REVENUE ($)</div>
          {REV_KEYS.map(k=><div key={k} style={{marginBottom:10}}><label style={styles.label}>{REV_LABELS[k]}</label><input style={inp} type="number" value={form.revenue[k]} onChange={e=>setRev(k,e.target.value)} placeholder="0"/></div>)}
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={handleSave} style={styles.primaryBtn}>Save Project</button>
        <button onClick={onCancel} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 20px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Grouped Analysis ────────────────────────────────────────────────────────
function GroupedAnalysis({ data, groupBy }) {
  const grouped = useMemo(()=>{
    const map={};
    data.forEach(p=>{const k=p[groupBy];(map[k]=map[k]||[]).push(p);});
    return Object.entries(map).map(([key,projects])=>{
      const agg=projects.reduce((a,p)=>{const t=calcTotals(p);return{rev:a.rev+t.totalRevenue,exp:a.exp+t.totalExpenses,imgs:a.imgs+p.numImages,cnt:a.cnt+1};},{rev:0,exp:0,imgs:0,cnt:0});
      const margin=agg.rev-agg.exp,mp=agg.rev>0?(margin/agg.rev)*100:0;
      return{key,...agg,margin,marginPct:mp,revPerImg:agg.imgs>0?agg.rev/agg.imgs:0,expPerImg:agg.imgs>0?agg.exp/agg.imgs:0};
    }).sort((a,b)=>b.rev-a.rev);
  },[data,groupBy]);
  const maxRev=Math.max(...grouped.map(g=>g.rev));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {grouped.map((g,i)=>(
        <div key={g.key} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px",transition:"border-color 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHover}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:2,background:PARTNER_COLORS[i%PARTNER_COLORS.length]}}/>
              <span style={{fontWeight:700,color:C.text,fontSize:15}}>{g.key}</span>
              <span style={{fontSize:11,color:C.muted,fontFamily:"'Space Mono',monospace"}}>{g.cnt} project{g.cnt!==1?"s":""}</span>
            </div>
            <div style={{display:"flex",gap:24}}>
              {[["REVENUE",fmt(g.rev),C.accent],["EXPENSES",fmt(g.exp),C.red],["MARGIN",fmtP(g.marginPct),g.marginPct>=40?C.accent:g.marginPct>=25?C.yellow:C.red],["REV/IMG",fmtD(g.revPerImg),C.purple],["EXP/IMG",fmtD(g.expPerImg),C.yellow]].map(([label,val,color])=>(
                <div key={label} style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:C.muted,fontFamily:"'Space Mono',monospace"}}>{label}</div>
                  <div style={{color,fontWeight:700,fontSize:13}}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:C.bg,borderRadius:3,height:5,overflow:"hidden"}}>
            <div style={{width:`${maxRev>0?(g.rev/maxRev)*100:0}%`,height:"100%",background:PARTNER_COLORS[i%PARTNER_COLORS.length],borderRadius:3,transition:"width 0.6s ease"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  label: { fontSize:11, color:C.muted, fontFamily:"'Space Mono',monospace", letterSpacing:1, textTransform:"uppercase", marginBottom:4, display:"block" },
  primaryBtn: { background:C.accent, color:"#060c14", border:"none", borderRadius:8, padding:"10px 24px", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:14 },
  chartCard: { background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"22px 24px" },
  chartHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
  chartTitle: { fontWeight:700, fontSize:15, color:C.text, fontFamily:"'DM Sans',sans-serif" },
  chartSub: { fontSize:11, color:C.muted, fontFamily:"'Space Mono',monospace", marginTop:3 },
};

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState(SAMPLE_DATA);
  const [view, setView] = useState("dashboard");
  const [editId, setEditId] = useState(null);
  const [groupBy, setGroupBy] = useState("partner");
  const [showDataSource, setShowDataSource] = useState(false);
  const [filters, setFilters] = useState({ partner:"All", product:"All", country:"All" });

  const setFilter=(k,v)=>setFilters(f=>({...f,[k]:v}));
  const options = k => ["All",...new Set(projects.map(p=>p[k]))];

  const filtered = useMemo(()=>projects.filter(p=>
    (filters.partner==="All"||p.partner===filters.partner)&&
    (filters.product==="All"||p.product===filters.product)&&
    (filters.country==="All"||p.country===filters.country)
  ),[projects,filters]);

  const totals = useMemo(()=>filtered.reduce((a,p)=>{
    const t=calcTotals(p);return{rev:a.rev+t.totalRevenue,exp:a.exp+t.totalExpenses,imgs:a.imgs+p.numImages};
  },{rev:0,exp:0,imgs:0}),[filtered]);

  const margin=totals.rev-totals.exp, marginPct=totals.rev>0?(margin/totals.rev)*100:0;

  const addProject=p=>{setProjects(prev=>[...prev,{...p,id:Date.now()}]);setView("projects");};
  const saveEdit=p=>{setProjects(prev=>prev.map(x=>x.id===editId?{...p,id:editId}:x));setView("projects");setEditId(null);};
  const deleteProject=id=>setProjects(prev=>prev.filter(p=>p.id!==id));
  const importData=rows=>{setProjects(prev=>[...prev,...rows]);};

  const navBtn=(label,key)=>(
    <button onClick={()=>setView(key)} style={{background:view===key?`${C.accent}15`:"transparent",color:view===key?C.accent:C.muted,border:"none",borderRadius:8,padding:"8px 18px",fontWeight:view===key?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,transition:"all 0.2s"}}>
      {label}
    </button>
  );

  const selectStyle={background:C.card,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"7px 12px",fontSize:12,fontFamily:"'Space Mono',monospace",cursor:"pointer",outline:"none"};
  const metricColor=(v)=>v>=40?C.accent:v>=25?C.yellow:C.red;

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>

      {/* Top Nav */}
      <div style={{borderBottom:`1px solid ${C.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,backdropFilter:"blur(10px)",position:"sticky",top:0,zIndex:50,background:`${C.bg}ee`}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:30,height:30,background:`linear-gradient(135deg,${C.accent},${C.purple})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#060c14"}}>▲</div>
          <span style={{fontWeight:700,fontSize:16,letterSpacing:-0.3,fontFamily:"'DM Sans',sans-serif"}}>Revenue Analytics</span>
          <span style={{fontSize:11,color:C.muted,fontFamily:"'Space Mono',monospace",marginLeft:4}}>{filtered.length} projects</span>
        </div>
        <div style={{display:"flex",gap:2,alignItems:"center"}}>
          {navBtn("Dashboard","dashboard")}
          {navBtn("Charts","charts")}
          {navBtn("Projects","projects")}
          <div style={{width:1,height:20,background:C.border,margin:"0 8px"}}/>
          <button onClick={()=>setShowDataSource(true)} style={{background:`${C.purple}20`,color:C.purple,border:`1px solid ${C.purple}40`,borderRadius:8,padding:"7px 16px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
            ⬆ Import Data
          </button>
          <button onClick={()=>setView("add")} style={{background:C.accent,color:"#060c14",border:"none",borderRadius:8,padding:"7px 16px",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,marginLeft:6}}>
            + New Project
          </button>
        </div>
      </div>

      <div style={{padding:"24px 28px",maxWidth:1280,margin:"0 auto"}}>
        {/* Filter Bar */}
        {(view==="dashboard"||view==="projects"||view==="charts") && (
          <div style={{display:"flex",gap:10,marginBottom:22,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:10,color:C.muted,fontFamily:"'Space Mono',monospace",letterSpacing:1}}>FILTER:</span>
            {["partner","product","country"].map(k=>(
              <select key={k} style={selectStyle} value={filters[k]} onChange={e=>setFilter(k,e.target.value)}>
                {options(k).map(v=><option key={v}>{v}</option>)}
              </select>
            ))}
            {Object.values(filters).some(v=>v!=="All") && (
              <button onClick={()=>setFilters({partner:"All",product:"All",country:"All"})}
                style={{background:"transparent",color:C.red,border:"none",cursor:"pointer",fontSize:12,fontFamily:"'Space Mono',monospace"}}>
                Clear ×
              </button>
            )}
          </div>
        )}

        {/* ── DASHBOARD ────────────────────────── */}
        {view==="dashboard" && (<>
          {/* KPI Cards */}
          <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
            {[
              ["Total Revenue",fmt(totals.rev),C.accent,`${filtered.length} projects`],
              ["Total Expenses",fmt(totals.exp),C.red,null],
              ["Gross Margin",fmt(margin),metricColor(marginPct),fmtP(marginPct)],
              ["Margin %",fmtP(marginPct),metricColor(marginPct),marginPct>=40?"✓ Healthy":marginPct>=25?"⚠ Watch":"✗ Low"],
              ["Revenue / Image",fmtD(totals.imgs>0?totals.rev/totals.imgs:0),C.purple,`${totals.imgs.toLocaleString()} images`],
              ["Expense / Image",fmtD(totals.imgs>0?totals.exp/totals.imgs:0),C.yellow,null],
            ].map(([label,val,color,sub])=>(
              <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 22px",flex:1,minWidth:140}}>
                <div style={{fontSize:10,fontFamily:"'Space Mono',monospace",color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{label}</div>
                <div style={{fontSize:24,fontWeight:700,color,fontFamily:"'DM Sans',sans-serif",letterSpacing:-0.5}}>{val}</div>
                {sub && <div style={{fontSize:11,color:C.muted,marginTop:4,fontFamily:"'Space Mono',monospace"}}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* Group by */}
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

        {/* ── CHARTS ───────────────────────────── */}
        {view==="charts" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <RevenueByPartnerChart projects={filtered}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <ExpensePerImageChart projects={filtered}/>
              <TravelExpenseChart projects={filtered}/>
            </div>
          </div>
        )}

        {/* ── PROJECTS ─────────────────────────── */}
        {view==="projects" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.length===0&&<div style={{textAlign:"center",color:C.muted,padding:48,fontFamily:"'Space Mono',monospace"}}>No projects match your filters.</div>}
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
                        {[p.product,p.country,p.month,`${p.numImages} imgs`].map((tag,i)=>(
                          <span key={i} style={{fontSize:11,background:C.bg,color:C.muted,borderRadius:4,padding:"2px 8px",fontFamily:"'Space Mono',monospace"}}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>{setEditId(p.id);setView("edit");}} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>Edit</button>
                      <button onClick={()=>deleteProject(p.id)} style={{background:"transparent",color:C.red,border:`1px solid ${C.red}40`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>Delete</button>
                    </div>
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
                            <span style={{color:"#c0cad8",fontFamily:"'Space Mono',monospace"}}>{fmt(vals[k])}</span>
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

        {/* ── ADD / EDIT ────────────────────────── */}
        {view==="add" && <ProjectForm onSave={addProject} onCancel={()=>setView("projects")}/>}
        {view==="edit" && (()=>{
          const proj=projects.find(p=>p.id===editId);
          if(!proj) return null;
          const initial={...proj,numImages:String(proj.numImages),
            expenses:Object.fromEntries(EXP_KEYS.map(k=>[k,String(proj.expenses[k])])),
            revenue:Object.fromEntries(REV_KEYS.map(k=>[k,String(proj.revenue[k])]))};
          return <ProjectForm onSave={saveEdit} onCancel={()=>setView("projects")} initial={initial}/>;
        })()}
      </div>

      {showDataSource && <DataSourcePanel onImport={importData} onClose={()=>setShowDataSource(false)}/>}
    </div>
  );
}