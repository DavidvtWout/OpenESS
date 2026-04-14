"use strict";(()=>{async function a(){let e=await fetch("/api/services-status");if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}document.addEventListener("DOMContentLoaded",()=>{g()});async function g(){let e=document.getElementById("service-stats");if(e)try{let t=await a();l(e,t)}catch(t){let r=t instanceof Error?t.message:"Unknown error";e.innerHTML=`<div class="error">Failed to load services status: ${r}</div>`}}function l(e,t){let r=[{key:"database",label:"Database"},{key:"optimizer",label:"Optimizer"}];e.innerHTML=r.map(n=>{let s=t[n.key];return s?o(n.label,s.status??"unknown",s.messages??[]):o(n.label,"unknown",[])}).join("")}function o(e,t,r){let n=d(t),s=f(t),u=t.charAt(0).toUpperCase()+t.slice(1),i="";return r.length>0&&(i=`<div class="service-messages">
            ${r.map(c=>`<div class="service-message">${c.message}</div>`).join("")}
        </div>`),`
        <div class="stat-card service-card">
            <div class="service-status ${n}">
                <span class="status-icon">${s}</span>
                <span class="status-text">${u}</span>
            </div>
            <div class="stat-label">${e}</div>
            ${i}
        </div>
    `}function d(e){switch(e){case"ok":return"status-ok";case"warning":return"status-warning";case"error":return"status-error";default:return"status-unknown"}}function f(e){switch(e){case"ok":return"&#10003;";case"warning":return"&#9888;";case"error":return"&#10007;";default:return"?"}}})();
