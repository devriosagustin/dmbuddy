import{i as e,n as t,t as n}from"./middleware-BUPvq8l_.js";var r=e(`file-text`,[[`path`,{d:`M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z`,key:`1oefj6`}],[`path`,{d:`M14 2v5a1 1 0 0 0 1 1h5`,key:`wfsgrz`}],[`path`,{d:`M10 9H8`,key:`b1mrlr`}],[`path`,{d:`M16 13H8`,key:`t4e002`}],[`path`,{d:`M16 17H8`,key:`z1uh3a`}]]),i=()=>typeof crypto<`u`&&`randomUUID`in crypto?crypto.randomUUID():`n-${Date.now()}-${Math.random().toString(36).substring(2,8)}`,a=`# Diario del Dungeon Master

Bienvenido a **DM Copilot Web**.

Escribe aquí tus ideas, NPCs, localizaciones o el resumen de la última sesión usando *Markdown*.

## Ejemplos
- **Negrita** y *cursiva*
- Listas
  - Anidadas
- [Enlaces](https://www.dndbeyond.com)
- > Citas de tus NPCs

¡Que rueden los dados! 🎲
`,o=t()(n((e,t)=>({notes:[{id:i(),title:`Bienvenido`,content:a,category:`Campaign`,tags:[`bienvenida`,`inicio`],createdAt:new Date,updatedAt:new Date,isFavorite:!0}],addNote:t=>{let n=new Date,r={...t,id:i(),createdAt:n,updatedAt:n};return e(e=>({notes:[r,...e.notes]})),r},updateNote:(t,n)=>{e(e=>({notes:e.notes.map(e=>e.id===t?{...e,...n,updatedAt:new Date}:e)}))},removeNote:t=>{e(e=>({notes:e.notes.filter(e=>e.id!==t)}))},toggleFavorite:t=>{e(e=>({notes:e.notes.map(e=>e.id===t?{...e,isFavorite:!e.isFavorite}:e)}))},exportNotes:()=>JSON.stringify(t().notes,null,2),importNotes:t=>{try{let n=JSON.parse(t);if(!Array.isArray(n))return!1;let r=n.filter(e=>typeof e.title==`string`&&typeof e.content==`string`);return r.length!==0&&(e({notes:r}),!0)}catch{return!1}}}),{name:`note-storage`})),s=[`Campaign`,`Session`,`NPCs`,`Locations`];export{o as n,r,s as t};