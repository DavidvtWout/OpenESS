"use strict";(()=>{async function _(){let e=await fetch("/api/services-status");if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}var T={theme:"dark",priceUnit:"eur",powerUnit:"w",weekStartDay:1};function y(e){let r=`; ${document.cookie}`.split(`; ${e}=`);return r.length===2?r.pop()?.split(";").shift()??null:null}function R(e,t){let r=new Date;r.setFullYear(r.getFullYear()+10),document.cookie=`${e}=${t}; expires=${r.toUTCString()}; path=/; SameSite=Lax`}function w(){let e={...T},t=y("theme");t&&(e.theme=t);let r=y("priceUnit");r&&(e.priceUnit=r);let n=y("powerUnit");n&&(e.powerUnit=n);let s=y("weekStartDay");return s!==null&&(e.weekStartDay=parseInt(s,10)),e}function b(e,t){R(e,t)}function p(e){document.documentElement.setAttribute("data-theme",e)}function k(){let e=w(),t=document.getElementById("theme-select");t.value=e.theme,t.addEventListener("change",function(){b("theme",this.value),p(this.value)});let r=document.getElementById("price-unit-select");r.value=e.priceUnit,r.addEventListener("change",function(){b("priceUnit",this.value)});let n=document.getElementById("power-unit-select");n.value=e.powerUnit,n.addEventListener("change",function(){b("powerUnit",this.value)});let s=document.getElementById("week-start-select");s.value=e.weekStartDay,s.addEventListener("change",function(){b("weekStartDay",this.value)}),p(e.theme)}document.addEventListener("DOMContentLoaded",k);document.readyState!=="loading"&&k();async function B(){let e=await fetch("/api/system-layout");if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}async function $(){let e=await fetch("/api/power-flow");if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}function m(e){return Math.abs(e)>=1e3?`${(e/1e3).toFixed(2)} kW`:`${Math.round(e)} W`}function C(e,t){let r=t.battery_systems.length,n=`
        <div class="power-flow-grid">
            <svg class="power-flow-lines" id="power-flow-svg"></svg>
            <div class="power-block grid-block" id="block-grid">
                <div class="block-label">Grid</div>
                <div class="block-values" id="grid-values">
                    ${t.phases.map(s=>`<div class="phase-value" id="grid-L${s}">L${s}: -- W</div>`).join("")}
                </div>
                <div class="block-total" id="grid-total">-- W</div>
            </div>
    `;t.has_solar&&(n+=`
            <div class="power-block solar-block" id="block-solar">
                <div class="block-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                    </svg>
                </div>
                <div class="block-label">Solar</div>
                <div class="block-total" id="solar-total">-- W</div>
            </div>
        `),n+=`
            <div class="power-block consumption-block" id="block-consumption">
                <div class="block-label">Consumption</div>
                <div class="block-values" id="consumption-values">
                    ${t.phases.map(s=>`<div class="phase-value" id="consumption-L${s}">L${s}: -- W</div>`).join("")}
                </div>
                <div class="block-total" id="consumption-total">-- W</div>
            </div>
    `,n+=`
            <div class="battery-row" id="battery-row" style="--battery-count: ${r}">
    `;for(let s of t.battery_systems)n+=`
                <div class="power-block battery-block" id="block-${s.id}">
                    <div class="block-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z"/>
                        </svg>
                    </div>
                    <div class="block-label">${s.name}</div>
                    <div class="block-total" id="${s.id}-power">-- W</div>
                    <div class="battery-status" id="${s.id}-status">--</div>
                </div>
        `;n+=`
            </div>

            <!-- Central Hub -->
            <div class="power-hub" id="power-hub"></div>
        </div>
    `,e.innerHTML=n,requestAnimationFrame(()=>E(t))}function E(e){let t=document.getElementById("power-flow-svg");if(!t)return;let r=t.parentElement;if(!r)return;let n=r.getBoundingClientRect();t.setAttribute("width",String(n.width)),t.setAttribute("height",String(n.height)),t.setAttribute("viewBox",`0 0 ${n.width} ${n.height}`);let s="",l=document.getElementById("power-hub");if(!l)return;let i=l.getBoundingClientRect(),o=i.left-n.left+i.width/2,a=i.top-n.top+i.height/2,f=document.getElementById("block-grid");if(f){let c=f.getBoundingClientRect(),u=c.right-n.left,d=c.top-n.top+c.height/2;s+=`<path class="flow-line" id="line-grid" d="M ${u} ${d} L ${o} ${a}" />`}let S=document.getElementById("block-consumption");if(S){let c=S.getBoundingClientRect(),u=c.left-n.left,d=c.top-n.top+c.height/2;s+=`<path class="flow-line" id="line-consumption" d="M ${o} ${a} L ${u} ${d}" />`}if(e.has_solar){let c=document.getElementById("block-solar");if(c){let u=c.getBoundingClientRect(),d=u.left-n.left+u.width/2,h=u.bottom-n.top;s+=`<path class="flow-line" id="line-solar" d="M ${d} ${h} L ${o} ${a}" />`}}for(let c of e.battery_systems){let u=document.getElementById(`block-${c.id}`);if(u){let d=u.getBoundingClientRect(),h=d.left-n.left+d.width/2,x=d.top-n.top;s+=`<path class="flow-line" id="line-${c.id}" d="M ${o} ${a} L ${h} ${x}" />`}}t.innerHTML=s}function P(e,t){let r=0;for(let i of e.phases){let o=t.grid[`L${i}`]??0;r+=o;let a=document.getElementById(`grid-L${i}`);a&&(a.textContent=`L${i}: ${m(o)}`)}let n=document.getElementById("grid-total");n&&(n.textContent=m(r),n.className=`block-total ${r>0?"importing":r<0?"exporting":""}`);let s=0;for(let i of e.phases){let o=t.consumption[`L${i}`]??0;s+=o;let a=document.getElementById(`consumption-L${i}`);a&&(a.textContent=`L${i}: ${m(o)}`)}let l=document.getElementById("consumption-total");if(l&&(l.textContent=m(s)),e.has_solar&&t.solar!==null){let i=document.getElementById("solar-total");i&&(i.textContent=m(t.solar))}for(let i of e.battery_systems){let o=t.batteries[i.id]??0,a=document.getElementById(`${i.id}-power`),f=document.getElementById(`${i.id}-status`);a&&(a.textContent=m(Math.abs(o)),a.className=`block-total ${o>0?"charging":o<0?"discharging":""}`),f&&(f.textContent=o>0?"Charging":o<0?"Discharging":"Idle",f.className=`battery-status ${o>0?"charging":o<0?"discharging":"idle"}`)}I(e,t)}function I(e,t){let r=Object.values(t.grid).reduce((i,o)=>i+o,0),n=document.getElementById("line-grid");n&&(n.classList.toggle("flow-importing",r>50),n.classList.toggle("flow-exporting",r<-50));let s=Object.values(t.consumption).reduce((i,o)=>i+o,0),l=document.getElementById("line-consumption");if(l&&l.classList.toggle("flow-active",Math.abs(s)>50),e.has_solar&&t.solar!==null){let i=document.getElementById("line-solar");i&&i.classList.toggle("flow-generating",t.solar>50)}for(let i of e.battery_systems){let o=t.batteries[i.id]??0,a=document.getElementById(`line-${i.id}`);a&&(a.classList.toggle("flow-charging",o>50),a.classList.toggle("flow-discharging",o<-50))}}function U(e,t){let r=[{key:"database",label:"Database"},{key:"optimizer",label:"Optimizer"}];e.innerHTML=r.map(n=>{let s=t[n.key];return s?L(n.label,s.status??"unknown",s.messages??[]):L(n.label,"unknown",[])}).join("")}function L(e,t,r){let n=A(t),s=H(t),l=t.charAt(0).toUpperCase()+t.slice(1),i="";return r.length>0&&(i=`<div class="service-messages">
            ${r.map(o=>`<div class="service-message">${o.message}</div>`).join("")}
        </div>`),`
        <div class="stat-card service-card">
            <div class="service-status ${n}">
                <span class="status-icon">${s}</span>
                <span class="status-text">${l}</span>
            </div>
            <div class="stat-label">${e}</div>
            ${i}
        </div>
    `}function A(e){switch(e){case"ok":return"status-ok";case"warning":return"status-warning";case"error":return"status-error";default:return"status-unknown"}}function H(e){switch(e){case"ok":return"&#10003;";case"warning":return"&#9888;";case"error":return"&#10007;";default:return"?"}}var g=null,v=null;async function M(){let e=document.getElementById("power-flow-container");if(e)try{g=await B(),C(e,g);let t=await $();P(g,t),v&&clearInterval(v),v=window.setInterval(async()=>{if(g)try{let r=await $();P(g,r)}catch(r){console.error("Failed to update power flow:",r)}},2e3),window.addEventListener("resize",()=>{g&&E(g)})}catch(t){let r=t instanceof Error?t.message:"Unknown error";e.innerHTML=`<div class="error">Failed to load power flow: ${r}</div>`}}async function D(){let e=document.getElementById("service-stats");if(e)try{let t=await _();U(e,t)}catch(t){let r=t instanceof Error?t.message:"Unknown error";e.innerHTML=`<div class="error">Failed to load services status: ${r}</div>`}}document.addEventListener("DOMContentLoaded",()=>{let e=w();p(e.theme),M(),D()});})();
