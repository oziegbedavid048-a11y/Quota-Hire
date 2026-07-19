import{r as d,j as e,A as w,m as j}from"./index-Ct8Wcz8m.js";import{E as k}from"./eye-off-DwC2haLJ.js";import{E as p}from"./eye-C9O1oXVR.js";import{C as y}from"./circle-alert-CdYn5eAT.js";const v=d.forwardRef(({icon:r,label:i,error:a,type:c="text",className:m="",...t},b)=>{const[x,u]=d.useState(!1),[l,h]=d.useState(!1);t.value;const o=c==="password",f=o&&l?"text":c;return e.jsxs("div",{className:`relative ${m}`,children:[e.jsx("label",{className:"block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 ml-1",children:i}),e.jsxs("div",{className:`
            relative flex items-center w-full rounded-2xl transition-all duration-300
            bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md
            border-2 
            ${a?"border-red-400 dark:border-red-500 shadow-[0_0_15px_rgba(248,113,113,0.3)]":x?"border-accent-400 dark:border-accent-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]":"border-white/50 dark:border-white/10 hover:border-white/70 dark:hover:border-white/20"}
          `,children:[r&&e.jsx("div",{className:`
              pl-4 pr-2 transition-colors duration-300 z-10
              ${a?"text-red-400":x?"text-accent-500":"text-neutral-500 dark:text-neutral-400"}
            `,children:r}),e.jsx("input",{ref:b,type:f,onFocus:n=>{var s;u(!0),(s=t.onFocus)==null||s.call(t,n)},onBlur:n=>{var s;u(!1),(s=t.onBlur)==null||s.call(t,n)},className:`
              w-full bg-transparent border-none outline-none 
              ${r?"pl-2":"pl-4"} pr-10 py-3.5
              text-neutral-900 dark:text-white font-medium
              placeholder:text-neutral-400 dark:placeholder:text-neutral-500
            `,placeholder:i,...t}),e.jsxs("div",{className:"absolute right-3 flex items-center gap-2 z-10",children:[o&&e.jsx("button",{type:"button",onClick:()=>h(!l),className:"text-neutral-400 hover:text-accent-500 transition-colors p-1",children:l?e.jsx(k,{size:18}):e.jsx(p,{size:18})}),a&&!o&&e.jsx(y,{size:18,className:"text-red-500"})]})]}),e.jsx(w,{children:a&&e.jsx(j.p,{initial:{opacity:0,y:-5},animate:{opacity:1,y:0},exit:{opacity:0,y:-5},className:"absolute -bottom-5 left-2 text-xs font-bold text-red-500",children:a})})]})});v.displayName="GlassInput";export{v as G};
