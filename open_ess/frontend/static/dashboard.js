"use strict";(()=>{document.addEventListener("DOMContentLoaded",()=>{u()});async function u(){let e=document.getElementById("service-stats");if(e)try{let s=await fetch("/api/services-status");if(!s.ok)throw new Error(`HTTP ${s.status}`);let t=await s.json();l(e,t)}catch(s){let t=s instanceof Error?s.message:"Unknown error";e.innerHTML=`<div class="error">Failed to load services status: ${t}</div>`}}function l(e,s){let t=[{key:"database",label:"Database"},{key:"optimizer",label:"Optimizer"}];e.innerHTML=t.map(n=>{let a=s[n.key];return a?i(n.label,a.status,a.messages||[]):i(n.label,"unknown",[])}).join("")}function i(e,s,t){let n=d(s),a=v(s),c=s.charAt(0).toUpperCase()+s.slice(1),r="";return t.length>0&&(r=`<div class="service-messages">
            ${t.map(o=>`<div class="service-message">${o.message}</div>`).join("")}
        </div>`),`
        <div class="stat-card service-card">
            <div class="service-status ${n}">
                <span class="status-icon">${a}</span>
                <span class="status-text">${c}</span>
            </div>
            <div class="stat-label">${e}</div>
            ${r}
        </div>
    `}function d(e){switch(e){case"ok":return"status-ok";case"warning":return"status-warning";case"error":return"status-error";default:return"status-unknown"}}function v(e){switch(e){case"ok":return"&#10003;";case"warning":return"&#9888;";case"error":return"&#10007;";default:return"?"}}})();
//# sourceMappingURL=dashboard.js.map
